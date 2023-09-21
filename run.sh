# configure aws credenciais de segurnaça
#aws configure
#access key id 
#secret access key 
#regiao defualt us-east-1 
#format json

default region name us-east-1
# 1-  criar o arquivo de segurança.
# 2 criar role de segurança na AWS - IAM

aws iam create-role \
    --role-name lambda-exemplo \
    --assume-role-policy-document file://politicas.json \
    | tee logs/role.log

# 3 - criar arquivo com conteudo e zipalo
#zip function.zip index.js

aws lambda create-function \
    --function-name hello-cli \
    --zip-file fileb://function.zip \
    --handler index.handler \
    --runtime nodejs16.x \
    --role arn:aws:iam::531295502703:role/lambda-exemplo \
    | tee logs/lambda-create.log
    