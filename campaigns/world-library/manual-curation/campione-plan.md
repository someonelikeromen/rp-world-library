# Campione! 世界归档方案

## 概况
- 系列：campione-main（23卷）+ campione-shiniki（3卷）= **26卷**
- 原文已按章节拆分（`01-序章.txt`...`10-后记.txt`）+ `_manifest.json`
- 已有策展数据：world.json、characters-index.json（789KB）、power-systems.json、关系/情节/知识/地点图谱
- 本管线产出：periods-based 结构化实体 + 统一图谱 + 可视化

## 与原管线差异
Campione 的 raw-text 已经是章节文件，不需做 full.txt→split-text 拆分。
但 pipeline 依赖 `chapters.json`（行号→章节文件映射）和 `full.txt`，因此：

**Step 0：准备 split-text 格式**
```
对每卷：
  1. 收集 _manifest.json 中章节 → 排序
  2. 遍历章节文件 → 累计行号
  3. 生成 chapters.json（startLine/endLine → outputPath）
  4. 生成 full.txt（全部章节串联）
  5. 复制到 split-text/{series}/vol-XX/
```

**后续流程**（与 hidan-no-aria 一致）：
- Wave 提取：26卷 ÷ 5卷/wave = 6 waves（wave-001~006）
- 卷级合并 → 组级合并 → 图谱构建 → 归档

## Wave 分配
```
wave-001: vol-01~05（5卷）
wave-002: vol-06~10（5卷）
wave-003: vol-11~15（5卷）
wave-004: vol-16~20（5卷）
wave-005: vol-21~23 + shiniki-vol-01~02（5卷）
wave-006: shiniki-vol-03（1卷）
```

## 执行顺序
1. 准备 split-text（26卷的 full.txt + chapters.json）
2. Wave 1~6 并行提取（Worker→Audit→Fix 闭环）
3. 树状合并（Level 1→5）
4. 图谱构建
5. 审计→修复→归档到 worlds/campione/extracted/
