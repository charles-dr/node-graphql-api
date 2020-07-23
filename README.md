# Background Scripts
## ! IMPORTANT

This branch is for the backgrouond scripts mainly for the translation.

Please don't merge this branch into main branch or other API development branch.

Thank you!

## How to do  (local environment)

#### this is for demo purpose 
#### test for deployment check - 4th change

## Environment
1. add to `~/.profile` node env `export NODENV=development`
2. copy 'credentials.example' folder as 'credentials' and update credentials.

## Configure Docker

1. add bridge network `docker network create --driver bridge shoclef_bridge`

## Using migrations for  DynamoDB

1. install `migrate-mongoose` globally `npm install -g migrate-mongoose`
2. run migrations `migrate up` (local use) or `npm run migrate-up` (this command use on the stage and prod servers)
