# AWS AppSync AI Agent Playground

## Prerequisites

This project requires the following resources / software available

For the python basted lambda functions

    - Python3
    - Docker
    - Langchain

For deployment of the code to aws

    - Version de node v18.17.0
    - Yarn
    - Npm
    - AWS CDK
    - An Aws Account

You also need to enable bedrock access to your AWS account.
To do so, navigate to the bedrock console -> manage model access -> enable access for claude

## Setup

Run the following to setup this project.

Note you need docker running to deploy the lambda functions

```
# Start with infra
cd cdk-infrastructure
npm i

# Build TS resolvers into JS
npm run build

# Deploy Infrastructure and populate tables with sample data
npm run deploy
```


## Desde aquí es lo importante para desplegar el aplicativo localmente, las indicaciones superiores son para desplegar la infraestuctura POR LO QUE NO debería hacerse sin permiso.
Then get the website running

```



# move to playground
cd ../playground

# Load endpoints from deployed stack so we know what api to talk to.
npm run configure

# install dependencies using yarn
yarn

# We are now ready to boot the website
npm run start
```

## Security

See CONTRIBUTING for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
