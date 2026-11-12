# 🌈 Vanity Passphrase
**Generate ETH vanity addresses via BIP39 Passphrases — without changing your seed phrase.**

🔒 **Offline-safe | Open-source | Deterministic**

📘 [中文说明](./README_zh.md)

---

## 🧠 What is this?

This tool lets you **generate custom (“vanity”) Ethereum addresses** — such as `0x888...` or `0xabcDEF...` —  
**without ever changing your original mnemonic seed**.

Instead of generating new mnemonics, it derives **different wallet addresses** by tweaking the **BIP39 passphrase**, a built-in but underused feature of the standard.

---

## 🚀 Features

✅ 100% local execution — no data ever leaves your browser  
✅ Compatible with all BIP39 mnemonics (12 / 24 words)  
✅ Generates addresses by brute-forcing passphrases  
✅ Fully deterministic: you can re-derive anytime  
✅ Simple HTML + JS — works offline (no dependencies)  

---

## 🌐 Demo

You can try the online demo here:  
👉 **[vanity.zhoulianglen.com](https://vanity.zhoulianglen.com)**  

(Offline usage is still recommended for security.)

---

## 🧩 How It Works

> BIP39 defines a “passphrase” that is mixed with the mnemonic to create the seed.  
> Changing the passphrase → changes the derived wallets → without changing your mnemonic.

This tool iterates through candidate passphrases and checks if the derived ETH address matches your custom pattern (for example starts with `0x8888`).

---

## 🖥️ Run Locally

You can run it **completely offline**.

```bash
git clone https://github.com/zhoulianglen/vanity-passphrase.git
cd vanity-passphrase
open index.html
```

or just double-click `index.html`.

---

## 📸 Screenshot

*(Insert a screenshot of your UI here)*

---

## ⚙️ Tech Stack

- **HTML + JavaScript** (pure, no build tools)
- **ethers.js v4 (UMD build)**
- **BIP39 seed derivation**
- **Offline-safe design**

---

## 📖 Example Usage

1. Enter your **mnemonic phrase** (offline environment recommended)  
2. Input a **target prefix**, e.g. `0x7777`  
3. Click **Start** — the script will derive passphrases until a match is found  
4. The matched passphrase and address will be displayed  

> You can verify the derived wallet in MetaMask or any HD wallet by importing the same mnemonic + found passphrase.

---

## ⚠️ Security Notice

- Always use this tool **offline** — ideally on an air-gapped computer.  
- Never upload or share your mnemonic or passphrase.  
- This is for **educational and research purposes** — use at your own risk.

---

## 🧑‍💻 Developer Notes

If you’d like to modify or contribute:
- Edit `index.html` and `main.js` directly.
- You can adjust the derivation path (default: `m/44'/60'/0'/0/0`).
- To support other chains, replace the ETH derivation logic in `main.js`.

---

## 🪙 Future Plans

- [ ] Regex pattern support  
- [ ] GPU-based parallel version  
- [ ] WebAssembly acceleration  

---

## 📜 License

MIT License © 2025 [zhoulianglen](https://github.com/zhoulianglen)

---

## ⭐️ Star This Repo

If you find this tool useful, please **give it a star** to help more people discover it 💫
