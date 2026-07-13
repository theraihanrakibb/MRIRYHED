# Country Clustering

Groups countries into clusters based on socio-economic indicators from the CIA World
Factbook. Uses feature similarity (distance-based) to find countries with comparable
profiles, then visualises the resulting clusters.

## Files

| File | Purpose |
|------|---------|
| `country-clustering.ipynb` | Clustering + visualisation notebook |
| `CIA_Country_Facts.csv`     | Country indicators (features) |
| `country_iso_codes.csv`     | ISO codes used for labelling/plotting |

## Run

```bash
pip install -r ../requirements.txt
jupyter notebook country-clustering.ipynb
```
