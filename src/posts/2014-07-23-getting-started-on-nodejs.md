---
title: Getting Started on NodeJS
date: '2014-07-23T02:07:52-05:00'
tags:
- nodejs
- express
---

###What is NodeJS?
NodeJS is a server side, event-driven, non-blocking IO JavaScript platform that helps create lightweight, fast and efficient applications

###What can I do with NodeJS?
Virtually anything! For example:

* DNS server https://github.com/tjfontaine/node-dns
* Chat server http://code.tutsplus.com/tutorials/using-nodejs-and-websockets-to-build-a-chat-service--net-34482
* Web application - This blog is built on [Ghost](https://ghost.org/) which runs on NodeJS!
* CSS preprocessor / JavaScript minification (e.g. [Grunt](http://gruntjs.com/), [Bower](http://bower.io/), [Bootstrap](http://getbootstrap.com/), etc)

###How do I get start?
Make sure that you have NodeJS installed, you can download it from http://nodejs.org. Once you can it installed, check that you can run it from your command prompt / terminal via the following command: 

        node --version
        
There are two important files/directories we need to know about:

1. **package.json** file
2. **node_modules** directory

###package.json
The package.json file stores metadata/information about your project. It typically has the following content

    {
      "name": "project-name",
      "version": "1.0.0",
      "description": "Project description",
      "author": "Your Name <your@email.com>"
      "private": true,
      "main": "main.js",
      "dependencies": {}
    }
    
    
* **Name** - the name of your project (required)
* **version** - the version of your project (required)
* **description** - additional information about your project (optional)
* **author** - author of this project, typically in ```author <email>``` pair, you can also use ```{"name":"Your Name", "email":"your@email.com"}```
* **private** - we do not want to publish this project to npm registry.
* **main** - the main entry point of your project. You can create a .js file with any name as your entry point and put the file name here.
* **dependencies** - dependencies or libraries that the project is going to use.

For more information about package.json file, visit http://browsenpm.org/package.json 

###node_modules
The node_modules stores downloaded project dependencies for your project. It can be project specific dependencies, which only usable in the same project, or global dependencies, which can be used in multiple projects.

The dependencies are usually published and downloaded from a registry. The default is https://www.npmjs.org

##Creating a Web Application Project
Create an empty directory for your project, you can name it anything you want, let's call it **MyProject** for now. Enter into the directory and create a file called **package.json** and another file called **main.js**. The package.json file describes information about your project and is very important especially if your project depends on third party modules. 

In your package.json file add the following content

    {
      "name": "myproject",
      "version": "1.0.0",
      "description": "NodeJS example",
      "author": "Your Name <your@email.com>"
      "private": true,
      "main": "main.js",
      "dependencies": {}
    }
    
Next, in your command prompt / terminal, execute the following command in **MyProject** directory:

    npm install express --save
    
This will download and install a dependencies called **express**, which is a light weight web application framework, and stored in node_modules folder. For more information about **express**, visit http://expressjs.com/

The command above will also append the dependency in the package.json file. You can also specify the dependency manually in the package.json file and execute just the ```npm install``` part to install the dependency.

Next, we will write our main application code in the **main.js** file. Add the following content to the **main.js** file:

    var express = require('express');
    var app = express();
    
    app.get('/',function(req,res){
        res.send('hello world');
    });
    
    app.listen(3000);
    
Let's explain the code above:  

`var express = require('express');` means that we import our dependencies, which in this case is *express*

`var app = express()` means that we create our Express based application in a variable call *app*

``app.get('/hello',function(req,res){
        res.send('hello world');
    });
`` 
means that when we visit http: / /&lt;hostname or localhost&gt;:&lt;port&gt;**/hello** it will print `hello world`

` app.listen(3000);` means that we run the application and listen to port 3000. You can also specify the hostname as second argument, such as `app.listen(3000,'example.com')`

Lastly, executed the following command and visit http://localhost:3000/hello from your browser and see your application in action!

###In Summary
We have learnt what NodeJS is, what it is capable of, some of the important files/directories and how to create a NodeJS based application with Express framework.
