---
title: A Gentle Introduction to MuleSoft Anypoint Platform
date: '2020-05-16T12:35:00-05:00'
tags:
- integration
- mulesoft
- etl 
---

Modern companies nowadays have been several software applications to run their businesses. In a typical scenario, a company could use CRM software, ERP software, human capital management software, or their internally developed software to handle their daily business operations.

Most of the time, these applications operated in silo, meaning that they don't work or communicate with other applications directly. In some cases, businesses would want to have some of these applications to work together, such as creating or updating a record in the ERP software whenever there is an order placed in the e-commerce software. This is where integration software such as the MuleSoft Anypoint platform step in.

## So what is MuleSoft Anypoint Platform exactly?

The MuleSoft Anypoint Platform is a unified platform for enterprise integration and API design, development, and deployment so that businesses can deliver results at an accelerated pace. It consists of several key components from within the platform as well as an IDE called the Anypoint Studio for power users and developers to design, implement and deploy applications from their workstations to the MuleSoft runtime on premise or the cloud.

## Key Components

### Design Center

The design center is a development environment where you can design API or Mule application flow from within the browser. It consists of two components, namely

- API designer - a web-based interface which allow developers to design API using Open API and/or RAML specification
- Flow designer - a web-based interface which allows developers or business analysts to create simple application flow for data integration and transformations from some systems to another.

### Anypoint Exchange

The Anypoint Exchange is an asset library like an app store, where you could discover, share, and incorporate assets published by developers in your company or other companies into your applications. Assets published in the Anypoint Exchange could be API specification, connectors, examples, templates, etc. They could be private, meaning that the asset is only available to you and your company; or public, meaning that the asset could be used by any people. 

For example, assuming that you want to build an application which sends a message to a Slack channel whenever a record is created/updated in Salesforce, you could discover that a [SalesForce Connector](https://anypoint.mulesoft.com/exchange/com.mulesoft.connectors/mule-salesforce-connector/) and a [Slack Connector](https://anypoint.mulesoft.com/exchange/org.mule.connectors/mule-slack-connector/) are available in the public Anypoint Exchange for you to use, which you don't have to reinvent the wheel. You could find the public Anypoint Exchange at https://anypoint.mulesoft.com/exchange.

### Runtime Manager

The Runtime Manager manages Mule application runtimes, servers, and APIs on-premises, on the cloud, or both from a unified web interface. You can deploy, manage, and monitor your Mule applications in any environment, or you could deploy from the Anypoint Studio IDE and then manage and monitor from the Anypoint Runtime Manager. You can set alert such that when a certain condition is met, such as when an application is not responding or its CPU usage exceeds certain threshold, and send email to the relevant party to remediate the problem. You can also configure VPN or VPC connections to your on-premises or cloud environments, such as AWS or GCP, so that your mule applications could communicate with applications or services running on those environments.

### API Manager
The Anypoint API Manager allows you to manages API designed from the Design Center and published to Anypoint Exchange or import APIs in a zip file from the file system. It allows you to have one or more instances of the same API in multiple environments, and you can proxy other APIs and apply caching, throttling or security policies on top of it. You could analyze your API usage and performance from the API manager and create alerts when certain criteria is met, such that when your API violates a policy.

### Access Management
Anypoint Access Management helps you configure access and permissions within your organization. It allows you to manage users and roles for those users on what a user can access or make changes. You can create business groups for finer control on access and resource usage so that a user is a specific business group can only access or use resources assigned to that business group. You could also setup the federated identity for single sign-on (SSO) using SAML 2.0 or OpenID Connect standards. In addition, you could also setup and manage external client applications that try to access to your API.

### Visualizer
Anypoint Visualizer allows you to visualize different aspects of an application network graph so that you can explore how your mule applications and their dependencies are connected to each other. An example of the visualizer

![https://docs.mulesoft.com/visualizer/_images/application-network.png](https://docs.mulesoft.com/visualizer/_images/application-network.png) *from MuleSoft documentation*

You can define application layers/hierachy and visualize how traffic flow from one layer to another. This is especially helpful when you try to understand at the architectural point-of-view or try to troubleshoot issues happened from underlying layers. 

### Monitoring
Anypoint Monitoring allows you to monitor your mule applications in different environments, and troubleshoot issues through built-in or customized dashboard visualization and search for aggregated logs. For example, you can visualize response time of an application, how many inbound requests, the average response time, JVM CPU percentage utilization, etc. You could trigger alerts when certain condition is met for your API (through API Manager) or your Mule applications (through Runtime Manager).

![](https://docs.mulesoft.com/monitoring/_images/intro-dashboard-built-in.png)

## Where can I learn more about MuleSoft Anypoint Platform?

You could learn more about MuleSoft Anypoint Platform at MuleSoft's [Getting Started](https://developer.mulesoft.com/) page and [Documentation](https://docs.mulesoft.com/general/) page
