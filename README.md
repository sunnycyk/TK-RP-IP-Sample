# TK-RP-IP-Sample

*Note*: to enable issuing features, you will need to submit a feature request on developer.trustedkey.com for issuing

*Note*: config.json is meant for local development only. Environment variables will override these values (see util files' constant declarations) For example, if you choose to deploy to heroku, the environment variables set in config vars section of your heroku app will override the values in config.json

### Instructions for Local Dev

1. Clone repo
2. Edit config.json with credentials from developer.trustedkey.com
3. npm i
4. npm start

### Instructions for Automatted Heroku Deployment

1. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/trustedkey/TK-RP-IP-Sample/tree/master)

### One-time Instructions for enabling editing for Heroku App (after using deploy button)
0. heroku login
1. heroku git:clone -a <APP_NAME>
2. git remote add origin https://github.com/trustedkey/TK-RP-IP-Sample
3. git pull origin master

Now you can make changes and push using `git push heroku master`

### Instructions for Manual AWS Deployment

1. Clone this repo
2. Edit config.json with credentials from developer.trustedkey.com
3. Create Elastic Beanstalk service on AWS 
4. Choose web server environment
5. Set a fixed domain name, and use this value for your host url (include domain suffix)
6. Choose Node.JS preconfigured platform
7. Upload a zip archive of your cloned repo with the edited config.json inside (make sure its the source files and does not include top level directory, otherwise you will get an error saying package.json cant be found)
8. Configure Additional Options > Software > Set Node version to 8+ and command to `npm start` > Save
9. Click create environment
10. Wait 5-10mins for deployment to complete

### Customization Guide

1. *Changing scopes*: adjust clients object in routes/oauth.js
2. *Changing claims requested*: adjust `genRoute` in routes/oauth.js
3. *Changing claims issued*: adjust `issue` case in switch in routes/oauth.js
4. *Changing look and feel*: adjust public/index.html
