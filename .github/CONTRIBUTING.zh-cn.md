# LCpkg 贡献指南

如果你希望 LCPkg 能变得更好用，并有意向参与进来，请先阅读[《开源指南》](https://opensource.guide/zh-cn/how-to-contribute/)和[《行为准则》](CODE_OF_CONDUCT.zh-cn.md)，然后继续阅读以下内容。

## Issue 规范

- issue 仅用于提交问题反馈、功能需求以及设计相关的内容，其它内容可能会被直接关闭，例如：
  - 不好用，差评！
  - XXX 不知道比你这个高到哪里去了
  - 求不要更新了，老子学不动了
- 在提交 issue 之前，请搜索相关内容是否已被提出。
- 请严格根据模板的说明来填充对应的内容，尽量用简洁清晰的语言描述你的内容，以降低他人的沟通成本。

## Pull Request 规范

- 在对此项目做大改动之前，请先提交 issue 进行讨论，在征得同意之后再开始你的工作，因为现在的架构设计还不够稳定，过大的改动会增加以后的重构难度。
- 提交信息的格式必须遵循 [Vue 的提交规范](https://github.com/vuejs/vue/blob/dev/.github/COMMIT_CONVENTION.md)，一个提交应该只做一件事情。
- 提交 PR 之前请 rebase，确保提交记录的整洁，最简单的方法是使用此命令：`git pull origin develop --rebase`

## 编码规范

遵循 ESLint 的即可。
