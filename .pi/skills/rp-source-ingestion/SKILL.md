# RP Source Ingestion

导入与整理世界设定来源。用户提供资料或需要记录设定来源时使用。

## 触发条件

- 用户提供作品资料、设定文件、图片、网页链接
- 需要把资料转成世界/力量体系/势力/地图/知识图谱节点
- 用户修正已有设定

## 流程

1. 确认来源类型：canon/adapted/campaign/session/gm/inference/rumor/web-fetch/user-file/user-correction/agent-summary
2. 记录来源元数据：URL/文件路径/抓取时间/解析工具
3. 提取可用事实，不把摘要当原文
4. 给每条事实标注可信度 S/A/B/C/D/E
5. 冲突时记录，不静默覆盖
6. 用户修正优先级最高

## 注意

- 谣言保留为 rumor，不覆盖事实
- agent 推导标注 inference
- 网页抓取记录 URL 和抓取时间
- 文件解析记录路径、页码或区域
