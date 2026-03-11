use crate::models::scheme::{
    ExtraResource, ResourceCategory, SchemeDefinition, SchemeVariant,
};

pub fn wanxiang_scheme() -> SchemeDefinition {
    SchemeDefinition {
        id: "wanxiang".into(),
        name: "万象拼音".into(),
        description: "万象拼音输入方案 - 全拼及多种双拼辅助码方案".into(),
        github_repo: "amzxyz/rime_wanxiang".into(),
        variants: vec![
            SchemeVariant {
                id: "base".into(),
                name: "基础拼音".into(),
                asset_pattern: "rime-wanxiang-base.zip".into(),
                description: "基础全拼方案，无辅助码".into(),
            },
            SchemeVariant {
                id: "flypy-fuzhu".into(),
                name: "小鹤双拼辅助码".into(),
                asset_pattern: "rime-wanxiang-flypy-fuzhu.zip".into(),
                description: "小鹤双拼 + 鹤形辅助码".into(),
            },
            SchemeVariant {
                id: "zrm-fuzhu".into(),
                name: "自然码辅助码".into(),
                asset_pattern: "rime-wanxiang-zrm-fuzhu.zip".into(),
                description: "自然码双拼 + 辅助码".into(),
            },
            SchemeVariant {
                id: "tiger-fuzhu".into(),
                name: "虎码辅助码".into(),
                asset_pattern: "rime-wanxiang-tiger-fuzhu.zip".into(),
                description: "虎码辅助码方案".into(),
            },
            SchemeVariant {
                id: "moqi-fuzhu".into(),
                name: "墨奇辅助码".into(),
                asset_pattern: "rime-wanxiang-moqi-fuzhu.zip".into(),
                description: "墨奇码辅助码方案".into(),
            },
            SchemeVariant {
                id: "shouyou-fuzhu".into(),
                name: "手游辅助码".into(),
                asset_pattern: "rime-wanxiang-shouyou-fuzhu.zip".into(),
                description: "手游辅助码方案".into(),
            },
            SchemeVariant {
                id: "wubi-fuzhu".into(),
                name: "五笔辅助码".into(),
                asset_pattern: "rime-wanxiang-wubi-fuzhu.zip".into(),
                description: "五笔画辅助码方案".into(),
            },
            SchemeVariant {
                id: "hanxin-fuzhu".into(),
                name: "汉心辅助码".into(),
                asset_pattern: "rime-wanxiang-hanxin-fuzhu.zip".into(),
                description: "汉心码辅助码方案".into(),
            },
        ],
        extra_resources: vec![
            ExtraResource {
                id: "gram-lts".into(),
                name: "语法模型 (完整版)".into(),
                description: "完整语法模型，提升整句输入准确度，约 198 MB".into(),
                category: ResourceCategory::GrammarModel,
                github_repo: "amzxyz/RIME-LMDG".into(),
                release_tag: "LTS".into(),
                asset_name: "wanxiang-lts-zh-hans.gram".into(),
                approx_size_bytes: 207_313_964,
                optional: true,
                dest_filename: None,
            },
            ExtraResource {
                id: "gram-mini".into(),
                name: "语法模型 (精简版)".into(),
                description: "精简语法模型，体积更小，约 100 MB".into(),
                category: ResourceCategory::GrammarModel,
                github_repo: "amzxyz/RIME-LMDG".into(),
                release_tag: "LTS".into(),
                asset_name: "wanxiang-mini-zh-hans.gram".into(),
                approx_size_bytes: 104_767_532,
                optional: true,
                dest_filename: None,
            },
            ExtraResource {
                id: "predict-db".into(),
                name: "预测数据库".into(),
                description:
                    "librime-predict 预测数据库，启用输入预测功能，约 35 MB。需要前端支持 librime-predict 插件"
                        .into(),
                category: ResourceCategory::PredictionDb,
                github_repo: "amzxyz/RIME-LMDG".into(),
                release_tag: "LTS".into(),
                asset_name: "wanxiang-lts-zh-hans-predict.db".into(),
                approx_size_bytes: 36_205_132,
                optional: true,
                dest_filename: None,
            },
        ],
    }
}
