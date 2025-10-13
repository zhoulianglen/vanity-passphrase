/* vanity_app_static_optimized.js — 即时反馈 + 快速停止 版
 * - 单线程、时间片执行（更流畅、可快速停止）
 * - 点击“开始”立即日志反馈 + 热身批次（很快看到派生输出）
 * - 兼容 ethers v5/v6；命中后“继续/停止”稳定
 * - 保留：下载CSV / 单步派生 / KPI / 词表或随机模式
 */
(function(){
  // ===== 工具 & 日志 =====
  const $ = id => document.getElementById(id);
  const elLog = $("log"), elFound = $("found");
  function log(msg){ const t=new Date().toLocaleTimeString(); elLog.textContent += `[${t}] ${msg}\n`; elLog.scrollTop = elLog.scrollHeight; }
  function setStatus(msg){ $("status").textContent = msg; }
  const esc = s => (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // 全局错误写日志（不让按钮卡死）
  window.onerror = (m,src,line,col,err)=>log(`[JS错误] ${m} @ ${src}:${line}:${col}${err&&err.stack?`\n${err.stack}`:""}`);
  window.onunhandledrejection = ev => log(`[未处理Promise] ${ev?.reason || ev}`);

  // ===== ethers v5/v6 兼容派生 =====
  function deriveAddr(mnemonic, pass, index){
    // v5
    if (window.ethers?.utils?.HDNode && window.ethers?.Wallet){
      const hd = ethers.utils.HDNode.fromMnemonic(mnemonic, pass);
      const child = hd.derivePath(`m/44'/60'/0'/0/${index}`);
      return new ethers.Wallet(child.privateKey).address;
    }
    // v6
    if (window.ethers?.HDNodeWallet && window.ethers?.Mnemonic){
      const m = ethers.Mnemonic.fromPhrase(mnemonic, pass);
      return ethers.HDNodeWallet.fromMnemonic(m, `m/44'/60'/0'/0/${index}`).address;
    }
    throw new Error("未检测到可用的 ethers HD API；请将 v5.7.2 或 v6.x 的 UMD 文件放到本页同目录。");
  }

  function addrMatch(addr, mode, prefix, suffix){
    const body = (addr||"").toLowerCase().replace(/^0x/,'');
    const p = (prefix||"").toLowerCase();
    const s = (suffix||"").toLowerCase();
    if (mode==='prefix') return !!p && body.startsWith(p);
    if (mode==='suffix') return !!s && body.endsWith(s);
    return !!p && !!s && body.startsWith(p) && body.endsWith(s);
  }

  // ===== 候选生成器（确定性） =====
  function* iterRandom(cs, lo, hi){
    const set = cs.split("");
    function* cart(n){
      if(n===0){ yield ""; return; }
      const idx = new Array(n).fill(0);
      while(true){
        yield idx.map(i=>set[i]).join("");
        let p=n-1;
        while(p>=0){
          idx[p]++;
          if (idx[p] < set.length) break;
          idx[p]=0; p--;
        }
        if (p<0) break;
      }
    }
    for (let L=lo; L<=hi; L++) yield* cart(L);
  }
  function* iterWord(lines){ for(const s of lines){ const t=(s||"").trim(); if(t) yield t; } }

  // 批次大小映射（更友好的“性能/流畅度”滑块）
  const batchFromSpeed = spd => ({1:32, 2:128, 3:256, 4:512, 5:1024}[String(spd)] ?? 256);

  // ===== 运行状态 / KPI =====
  let running = false;
  let t0 = 0, tried = 0, results = [];
  let loopTimer = null;           // setTimeout 句柄（单一）
  const SLICE_MS = 16;            // 单个时间片目标时长（~60FPS）
  const CHECK_INTERVAL = 16;      // 每处理多少条检查一次 running/time

  function kpi(){
    const dt = (performance.now()-t0)/1000;
    $("kpiTried").textContent   = String(tried);
    $("kpiElapsed").textContent = dt.toFixed(1);
    $("kpiRate").textContent    = dt>0 ? (tried/dt).toFixed(1) : "0";
  }

  function clearLoopTimer(){
    if (loopTimer){ clearTimeout(loopTimer); loopTimer = null; }
  }

  // ===== 单步派生 =====
  function oneShot(){
    try{
      const m = $("mnemonic").value.trim();
      if(!m){ alert("请先填入助记词（仅测试助记词）"); return; }
      const p = $("onePass").value;
      const i = parseInt($("addrIndex").value,10)||0;
      const a = deriveAddr(m, p, i);
      $("oneOut").innerHTML = `passphrase=<span class="mono">${esc(p)}</span> → address=<span class="mono">${a}</span>`;
      log(`[单步] ${JSON.stringify(p)} → ${a}`);
    }catch(e){ $("oneOut").textContent = "错误：" + (e?.message||e); log(`[单步错误] ${e?.message||e}`); }
  }

  // ===== 下载 CSV =====
  function downloadCSV(){
    if(!results.length) return;
    const lines = [["passphrase","address"].join(",")].concat(
      results.map(r => `${JSON.stringify(r.passphrase)},${r.address}`)
    );
    const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vanity_matches_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== 停止（立刻响应） =====
  function stop(){
    if(!running) return;
    running = false;
    clearLoopTimer();
    $("startBtn").disabled   = false;
    $("stopBtn").disabled    = true;
    setStatus("已停止。");
    log("已停止。");
  }

  // ===== 内部：处理一个时间片 =====
  function processSlice(ctx){
    const { iter, batchSize, mnemonic, index, matchMode, prefix, suffix, hitAction } = ctx;
    const start = performance.now();
    let processed = 0;

    while (running && (performance.now() - start) < SLICE_MS) {
      // 每个 slice 内，我们按“微批次”推进，避免一次性 push 大数组
      for (let i=0; i<batchSize; i++){
        const n = iter.next();
        if (n.done){
          // 没有更多候选
          stop();
          log("无更多候选，结束。");
          return;
        }
        const pass = n.value;

        // 派生 & 匹配
        let addr;
        try{ addr = deriveAddr(mnemonic, pass, index); }
        catch(e){ log(`[派生异常] ${e?.message || e}`); continue; }

        tried++;
        processed++;
        if (tried <= 10) log(`[派生] ${JSON.stringify(pass)} → ${addr}`);

        if (addrMatch(addr, matchMode, prefix, suffix)){
          results.push({passphrase: pass, address: addr});
          $("downloadBtn").disabled = false;
          const rows = results.map((r,i)=>`${i+1}. ${esc(r.passphrase)} → ${r.address}`).join("<br>");
          elFound.innerHTML = `<div class="ok">已命中 ${results.length} 个</div>
                               <div>${rows}</div>
                               <div class="small warn" style="margin-top:6px;">请线下记录，勿截图/云同步。</div>`;
          log(`命中 → ${addr}  pass=${pass}`);

          if (hitAction === 'stop'){ stop(); return; }
          // hitAction === 'keep'：继续搜集
        }

        // 周期性检查是否需要让出主线程，以提高响应性
        if ((processed % CHECK_INTERVAL) === 0){
          if (!running) return;                       // 用户请求停止
          if ((performance.now() - start) >= SLICE_MS) break; // 时间片到
        }
      }
    }

    // 片尾更新 KPI，并排队下一片
    kpi();
    if (running){
      clearLoopTimer();
      loopTimer = setTimeout(()=>processSlice(ctx), 0); // 让出主线程后继续
    }
  }

  // ===== 开始（立即反馈 + 热身批次） =====
  function start(){
    try{
      if (running) return;

      // 依赖自检
      if (!window.ethers || !(ethers.utils?.HDNode || (ethers.HDNodeWallet && ethers.Mnemonic))){
        alert("缺少/不兼容的 ethers.umd.min.js。请将 v5.7.2 或 v6.x 的 UMD 文件放到本页同目录。");
        log("start中断：未检测到可用的 ethers HD API");
        return;
      }

      const mnemonic  = $("mnemonic").value.trim();
      if (!mnemonic){ alert("请填写助记词（仅测试助记词）"); return; }

      const index     = parseInt($("addrIndex").value,10)||0;
      const prefix    = ($("prefix").value||"").trim();
      const suffix    = ($("suffix").value||"").trim();
      const mode      = (document.querySelector('input[name="mode"]:checked')||{}).value || "random";
      const matchMode = $("matchMode").value;

      // 命中行为（容错：缺失/无效都回退 keep，让循环不抛错）
      const hitActionEl = $("hitAction");
      const rawHit      = (hitActionEl && hitActionEl.value) ? String(hitActionEl.value) : "keep";
      const hitAction   = (rawHit==="stop" || rawHit==="keep") ? rawHit : "keep";

      if (matchMode==='prefix' && !prefix){ alert("前缀匹配需填写前缀"); return; }
      if (matchMode==='suffix' && !suffix){ alert("后缀匹配需填写后缀"); return; }
      if (matchMode==='both' && (!prefix || !suffix)){ alert("前后缀同时匹配需同时填写"); return; }

      const charset   = $("charset").value;
      const minLen    = Math.max(1, parseInt($("minLen").value,10)||3);
      const maxLen    = Math.max(1, parseInt($("maxLen").value,10)||6);
      if (minLen > maxLen){ alert("最小长度不能大于最大长度"); return; }
      const targetBatch = batchFromSpeed(parseInt($("speed").value,10)||3);
      const wordLines = $("wordlist").value.split("\n");

      // 初始化 UI（立即反馈）
      $("log").textContent = "";
      elFound.innerHTML    = "<div>搜索中…</div>";
      $("startBtn").disabled   = true;
      $("stopBtn").disabled    = false;
      $("downloadBtn").disabled= true;
      results = []; tried = 0; t0 = performance.now(); kpi();
      setStatus("运行中…");
      const ver = (ethers.version || ethers.utils?.version || "未知版本");
      log(`启动：ethers=${ver} mode=${mode} match=${matchMode} prefix='${prefix||""}' suffix='${suffix||""}' index=${index} batch=${targetBatch} hitAction=${hitAction} len=[${minLen},${maxLen}]`);
      // 关键：马上给用户一个“已经开始”的可见信号
      log("正在准备候选与热身…");

      running = true;

      // 构造迭代器
      const iter = (mode==="wordlist") ? iterWord(wordLines) : iterRandom(charset, minLen, maxLen);

      // 先跑一个「热身批次」：更小的 batch（例如 32），保证**立即**能看到派生日志
      const warmupCtx = {
        iter, mnemonic, index, matchMode, prefix, suffix, hitAction,
        batchSize: Math.min(32, targetBatch)
      };
      clearLoopTimer();
      loopTimer = setTimeout(()=>{
        if (!running) return;
        processSlice(warmupCtx);
        // 热身后自动切换到目标批次继续无缝运行
        if (running){
          const ctx = { iter, mnemonic, index, matchMode, prefix, suffix, hitAction, batchSize: targetBatch };
          clearLoopTimer();
          loopTimer = setTimeout(()=>processSlice(ctx), 0);
        }
      }, 0);

    }catch(e){
      log(`[start异常] ${e?.message || e}`);
      // 确保按钮不被卡死
      $("startBtn").disabled = false;
      $("stopBtn").disabled  = true;
      setStatus("异常已记录");
    }
  }

  // ===== 绑定（按钮始终可点；开始时自检） =====
  (function boot(){
    try{
      $("btnOne").onclick      = oneShot;
      $("startBtn").onclick    = start;
      $("stopBtn").onclick     = stop;
      $("downloadBtn").onclick = downloadCSV;
      $("stopBtn").disabled    = true;
      $("downloadBtn").disabled= true;
      setStatus("就绪。");
      const ver = (window.ethers && (ethers.version || ethers.utils?.version)) || "未检测到";
      log(`boot：ethers=${ver}`);
    }catch(e){
      log(`[boot错误] ${e?.message || e}`);
    }
  })();
})();