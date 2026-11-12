# 🌈 Vanity Passphrase
**通过 BIP39 Passphrase 生成 ETH 靓号地址——无需更换原有助记词。**

🔒 **离线安全 | 开源 | 可复现**

📗 [English Version](./README.md)

---

## 🧠 这是什么？

这个工具可以帮助你 **生成个性化（靓号）的以太坊地址**，例如 `0x888...` 或 `0xabcDEF...`，  
**而无需更换你原本的助记词（Mnemonic Seed）**。

原理是利用 BIP39 标准中不常被使用的 **Passphrase（密码短语）** 机制，  
通过更改 Passphrase 来派生出不同的钱包地址。

---

## 🚀 功能特点

✅ 100% 本地运行，数据不会上传或泄露  
✅ 兼容所有 BIP39 助记词（12 / 24 个单词）  
✅ 通过暴力搜索方式生成符合规则的地址  
✅ 完全可复现（同样助记词 + Passphrase 可再次生成）  
✅ 纯 HTML + JS 实现，支持离线使用  

---

## 🌐 在线 Demo

你可以直接访问 Demo 页面体验：  
👉 **[vanity.zhoulianglen.com](https://vanity.zhoulianglen.com)**  

（推荐离线运行以确保安全）

---

## 🧩 工作原理

> BIP39 定义了一个可选的 “Passphrase” 参数，与助记词一起生成种子（Seed）。  
> 当你更改 Passphrase 时，钱包地址也会随之改变，但助记词本身不变。

该工具通过循环尝试不同的 Passphrase，检查派生出的以太坊地址是否匹配你的目标规则（例如以 `0x8888` 开头）。

---

## 🖥️ 本地运行方式

你可以 **完全离线运行**。

```bash
git clone https://github.com/zhoulianglen/vanity-passphrase.git
cd vanity-passphrase
open index.html
```

或直接双击打开 `index.html` 文件。

---

## 📸 截图示例

*(在此插入你的工具界面截图)*

---

## ⚙️ 技术栈

- **HTML + JavaScript**（纯前端实现）  
- **ethers.js v4 (UMD 版本)**  
- **BIP39 助记词派生算法**  
- **离线安全设计**

---

## 📖 使用方法

1. 输入你的 **助记词**（建议在离线环境中使用）  
2. 输入目标前缀，例如 `0x7777`  
3. 点击 **开始** 按钮，程序将自动尝试生成符合条件的地址  
4. 页面将显示找到的 **匹配地址** 与对应的 **Passphrase**  

> 你可以使用相同助记词 + 该 Passphrase 在 MetaMask 或任意 HD 钱包中导入验证。

---

## ⚠️ 安全提示

- 请务必在 **离线电脑** 上使用本工具（最好是隔离环境）。  
- **不要** 上传或分享你的助记词或 Passphrase。  
- 本工具仅供 **学习与研究用途**，使用风险由用户自行承担。

---

## 🧑‍💻 开发者说明

如果你想修改或贡献代码：
- 直接编辑 `index.html` 和 `main.js`  
- 默认派生路径为：`m/44'/60'/0'/0/0`  
- 若想支持其他链，可修改 `main.js` 中的地址派生逻辑

---

## 🪙 未来计划

- [ ] 支持正则表达式匹配规则  
- [ ] GPU 并行版本  
- [ ] WebAssembly 加速版本  

---

## 📜 开源协议

MIT License © 2025 [zhoulianglen](https://github.com/zhoulianglen)

---

## ⭐️ 支持本项目

如果你觉得本工具有用，请点亮一个 ⭐️ Star，  
帮助更多人发现它 💫
