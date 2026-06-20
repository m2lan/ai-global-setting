# Claude全局配置规则

## settings.json
```
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit",
      "MultiEdit",

      "Write(src/**)",
      "Write(tests/**)",

      "Bash(npm *)",
      "Bash(pnpm *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",

      "Bash(cat *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(find *)"
    ],

    "deny": [
      "Read(**/.env*)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(**/secrets/**)",
      "Read(**/credentials/**)",

      "Write(**/.env*)",
      "Write(**/secrets/**)",
      "Write(package-lock.json)",
      "Write(.github/workflows/*)",

      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(git push *)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(docker *)",
      "Bash(curl * | sh)",
      "Bash(chmod *)"
    ],

    "defaultMode": "acceptEdits"
  }
}
```

## CLAUDE.md
```
# 全局规则

## 沟通方式
- 默认中文回复；代码、命令、变量名、文件路径保持英文
- 结论先行，简洁直接，不先铺垫背景
- 不谄媚，不夸"这是个很好的问题"，不以"当然可以"开头
- 给真实判断——方案有问题直接指出，发现更好做法主动说明

## Git
- 不自动 git commit 或 git push，除非我明确要求
- 提交前先展示将要提交的变更摘要
- commit message 使用简洁英文

## 红线操作
以下操作即使在 auto-accept 模式下也必须先问我：
- 删除文件、目录或 git 历史
- 修改 .env、密钥、token、证书、CI/CD 配置
- git push、git rebase、git reset --hard、强制推送
- 公开发布（npm publish、生产部署等）
```

## 全局 .gitignore

路径：`~/.gitignore`

```
# AI 工具本地配置
.claude/settings.local.json
.cursor/
.aider*
.continue/
.cody/

# 密钥和凭证
*.pem
*.key
credentials.json
.npmrc
.aws/
.ssh/
```

配置命令：
```bash
git config --global core.excludesfile ~/.gitignore
```