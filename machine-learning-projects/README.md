# MRIRYHED Mind · Machine Learning Projects

A collection of self-contained ML mini-projects, each in its own folder with a
notebook, dataset(s), and a `README.md`. Built by **MRIRYHED** as part of the
Raihan portfolio. They cover the core supervised and unsupervised learning
workflows — classification, regression, clustering, and recommender systems —
plus an NLP sentiment task.

## Projects

| Folder | Task | Algorithm |
|--------|------|-----------|
| `heart-disease-prediction/`     | Predict heart disease (classification) from clinical features | Logistic / tree-based classifier |
| `house-price-elasticnet/`       | Predict house price (regression) after preprocessing | ElasticNet |
| `knn-sonar-classification/`     | Classify sonar returns as **mine vs rock** | K-Nearest Neighbours |
| `dbscan-customer-segmentation/` | Segment customers by spending behaviour | DBSCAN clustering |
| `svm-wine-fraud/`               | Detect fraudulent wine (classification) | Support Vector Machine |
| `sentiment-analysis/`           | Classify movie-review sentiment (NLP) | Text preprocessing + classifier |
| `country-clustering/`           | Group countries by socio-economic indicators | Distance-based clustering |
| `recommender-system/`           | Movie recommendations | Collaborative filtering |

## Setup

All notebooks share one environment. From this directory:

```bash
pip install -r requirements.txt
jupyter notebook
```

Then open any `<project>/<project>.ipynb`.

## Notes

- Each subfolder is independent; open its `README.md` for that project's data files
  and specifics.
- Datasets are included alongside the notebooks (e.g. `heart.csv`, `sonar.all-data.csv`,
  `u.data` / `u.item` for the recommender).

---

Part of the **MRIRYHED** suite: **MRIRYHED Weather**, **MRIRYHED Code**, **MRIRYHED Zodiac**,
**MRIRYHED Chat**, and **MRIRYHED Mind** (this collection).
