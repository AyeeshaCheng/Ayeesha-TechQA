# Shell 命令练习

本目录用于练习常见 Shell 命令，通过 [OverTheWire Bandit](https://overthewire.org/wargames/bandit/bandit0.html) 闯关游戏寓教于乐。

## 什么是 Bandit？

Bandit 是 OverTheWire 社区提供的 Linux 命令行闯关游戏，共 34 关（Level 0 → Level 34）。每一关要求你通过 SSH 连接到远程服务器，利用各种 Shell 命令找到密码，从而进入下一关。关卡由浅入深，覆盖了大多数常用的 Linux 命令行知识。

## 如何开始

### 1. 连接方式

```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

- **用户名**: `bandit0`
- **密码**: `bandit0`
- **端口**: `2220`

### 2. 关卡进度

每通过一关会获得下一关的密码，格式为 `banditN`（N 为关卡编号）。将密码保存下来，用于下次登录。

建议在本目录下创建 `passwords.txt` 记录每关密码：

```bash
echo "Level 0: bandit0" > passwords.txt
```

## 关卡涵盖的知识点

| 关卡 | 涉及命令 / 知识点 |
|------|-------------------|
| Level 0 → 1 | `cat`, `ls`, 读取文件 |
| Level 1 → 2 | `cat ./–` (特殊文件名处理) |
| Level 2 → 3 | `cat "spaces in filename"` (含空格文件名) |
| Level 3 → 4 | `ls -a`, `cd`, 隐藏文件 |
| Level 4 → 5 | `file`, 识别文件类型 |
| Level 5 → 6 | `find -size`, 按大小搜索 |
| Level 6 → 7 | `find -user -group`, 按属主/属组搜索 |
| Level 7 → 8 | `grep`, 文本搜索 |
| Level 8 → 9 | `sort`, `uniq -u`, 统计去重 |
| Level 9 → 10 | `strings`, 二进制文件中提取可读文本 |
| Level 10 → 11 | `base64 -d`, Base64 解码 |
| Level 11 → 12 | `tr`, 字符替换 (ROT13) |
| Level 12 → 13 | `xxd`, `gzip/bzip2/tar`, 十六进制与压缩 |
| Level 13 → 14 | SSH 私钥登录 |
| Level 14 → 15 | `nc` (netcat), 网络通信 |
| Level 15 → 16 | `openssl s_client`, SSL/TLS 连接 |
| Level 16 → 17 | `nmap`, 端口扫描 |
| Level 17 → 18 | `diff`, 文件对比 |
| Level 18 → 19 | `.bashrc` 被修改时的绕过技巧 |
| Level 19 → 20 | `./` 执行 SUID 程序 |
| Level 20 → 21 | `su` + SUID 提权 |
| Level 21 → 22 | `cron`, 定时任务 |
| Level 22 → 23 | `md5sum`, 脚本分析 |
| Level 23 → 24 | cron 脚本与通配符注入 |
| Level 24 → 25 | brute force + shell 脚本 |
| Level 25 → 26 | `more` 分页器与 Vim 逃逸 |
| Level 26 → 27 | Vim 逃逸 + SUID |
| Level 27 → 28 | `git clone` |
| Level 28 → 29 | `git log`, `git show` |
| Level 29 → 30 | `git branch` |
| Level 30 → 31 | `git tag` |
| Level 31 → 32 | `git push` |
| Level 32 → 33 | `$0` 参数注入 |
| Level 33 → 34 | 终极关卡 |

## 练习方式

### 方法一：直接 SSH

在终端中直接使用 SSH 连接，每一步都手动操作：

```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

### 方法二：VS Code Remote-SSH

如果你在使用 VS Code，可以通过 Remote-SSH 插件连接：

```bash
# 在 ~/.ssh/config 中添加
Host bandit
    HostName bandit.labs.overthewire.org
    User bandit0
    Port 2220
```

### 方法三：本目录记录解题过程

建议在本目录按关卡创建子目录，例如：

```
Shell/
├── README.md
├── passwords.txt
├── level-00/
│   └── solution.sh      # 解题命令
├── level-01/
│   └── solution.sh
└── ...
```

每关的 `solution.sh` 记录你用到的关键命令和思路。

## 有用的参考资源

- [Bandit 官方页面](https://overthewire.org/wargames/bandit/)
- [OverTheWire 社区](https://overthewire.org/)
- 善用 `man <command>` 查看命令手册
- 遇到困难可以用 `--help` 或 Google 搜索具体命令用法

## 小贴士

1. **每次登录都要用前一关的密码** — 记得保存好密码
2. **密码文件通常藏在意想不到的地方** — 仔细读题
3. **`man` 是最好的老师** — 养成查手册的习惯
4. **不要怕试错** — 闯关游戏的设计初衷就是让你在探索中学习
5. **享受过程** — 每过一关你都会掌握新的命令行技能 🎯

---

> *"The only way to learn command line is to use it."* — 某位不知名的系统管理员
