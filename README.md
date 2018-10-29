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
2. Add HOST config var (set it to something like https://appname.herokuapp.com)
3. Add CLIENTID config var (get this from developer.trustedkey.com)
4. Add CLIENTSECRET config var (get this from developer.trustedkey.com)

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
7. Upload a zip archive of your cloned repo with the edited config.json inside
8. Configure Additional Options > Software > Set Node version to 8+ and command to `npm start` > Save
9. Click create environment

### Customization Guide

1. *Changing scopes*: adjust routes/oauth.js line 10, 11, or 12
2. *Changing claims requested*: adjust config.json "claims" key
3. *Changing claims issued*: adjust routes/oauth.js line 54-59
4. *Changing look and feel*: adjust public/index.html
