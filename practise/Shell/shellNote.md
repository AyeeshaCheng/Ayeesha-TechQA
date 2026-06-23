
| 连接练习环境 | 
ssh username@域名/ip -p 连接端口

| Level 0 → 1 | `cat`, `ls`, 读取文件 |
ls folder  # 显示指定文件夹下内容
cat filename # 打印文件内容
file filename # 文件类型
du filename/folder # 文件大小
find filename # 查找文件

| Level 1 → 2 | `cat ./–` (特殊文件名处理) |
特殊文件名 -
cat ./- 指定路径下./ 避免-误认为操作符
cat < - 将-文件内容重定向到cat输出

| Level 2 → 3 | `cat "spaces in filename"` (含空格文件名) |
cat -- '--spaces in this filename--'  # 用--截断命令行解释，--后面都是文件名

| Level 3 → 4 | `ls -a`, `cd`, 隐藏文件 |
ls -a # 显示全部文件，包括隐藏
ls -l # 显示所有文件权限，不包括隐藏
cat ...Hiding-From-You

| Level 4 → 5 | `file`, 识别文件类型 |
file -- -file00 -file07  #可读文件为ASCII TEXT
cat -- -file07

| Level 5 → 6 | `find -size`, 按大小搜索 |
find ./inhere -type f -size 1033c ! -perm /111
-type f  # file类型
-size 1033c  # 指定大小
! -perm 111  # 所有者、同组、其他人都没有执行权限，-perm为permission，777中每一个7代表111，分别为rwx读写执行

| Level 6 → 7 | `find -user -group`, 按属主/属组搜索 |
find / -type f -size 33c -user bandit7 -group bandit6 2>/dev/null
/  # 指定从根目录扫描
-type f  #指定文件类型
-size 33c  #指定33c大小
-user bandit7  #指定个人所有者
-group bandit6  #指定机构所有者
2>/dev/null  # 标准错误输出丢弃(Permission denied),只打印符合条件的数据
``` 
0：标准输入 stdin（键盘输入）
1：标准输出 stdout（正常打印的文字，find 找到文件的路径）
2：标准错误 stderr（报错信息，比如 Permission denied）
```

| Level 7 → 8 | `grep`, 文本搜索 |
cat data.txt | grep 'milloneth'

| Level 8 → 9 | `sort`, `uniq -u`, 统计去重 |
sort data.txt | uniq -u  # -u unique出现一次； -d duplicate重复；-c count 统计出现次数


| Level 9 → 10 | `strings`, 二进制文件中提取可读文本 |
strings data.txt | grep '='


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