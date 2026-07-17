# Deployment Guide

## GitHub Pages (Frontend)
```bash
# Automatic: Push to main branch
git push origin main
# Live in 2-3 minutes at:
# https://labstudiopna.github.io/ConstructorIA/
```

## AWS Backend (Backend)
```bash
# 1. EC2 Instance
aws ec2 run-instances --image-id ami-xxx --instance-type t3.medium

# 2. RDS PostgreSQL
aws rds create-db-instance --db-instance-identifier constructoria --engine postgres

# 3. Docker deploy
docker-compose up -d

# 4. SSL Cert (AWS Certificate Manager)
# 5. CloudFront CDN
```

## Local Development
```bash
npm install
docker-compose up
npm start
```
