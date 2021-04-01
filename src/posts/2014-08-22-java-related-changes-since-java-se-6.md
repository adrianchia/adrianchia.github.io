---
title: Java Syntax Related Changes Since Java SE 6
date: '2014-08-22T02:22:44-05:00'
tags:
- android
- java
- jdk
---

In this post I am going to discuss about JDK related changes since version 6 and how it may affect Android development.

What's New in Java SE 7 Syntax
----------------------
* Binary Literals

    We may display **0b** or **0B** in front of a number to indicate a binary number. E.g. 
    
    ```java
    int aNum = 0b00100001 // 33
    ```

* Underscore in Numeric Literals

    We can separate a group of numbers with underscore in between digits to make it more readable, and the actual value is the same as without underscore
    
    ```java
    long ccNumber = 1111_1111_1111_1111L // which is the same as 1111111111111111L
    ```

    **Note**
    1. We cannot add underscore before and after decimal point
    2. We cannot add underscore as a prefix to a number (this make it as identifier and not a numeric literal)
    3. We cannot add underscore as a suffix to a number
    4. We cannot add underscire in the 0x radix prefix

* String in Switch Statement

    In Java SE 6 if we want to do a conditional statement on a String we need to do it in a if...else Statement
    
    ```java
    if(a.equals("apple")) {
        // do something
    } else if (a.equals("orange")) {
      // do another thing
    } else if (a.equals("pear")) {
      // do some other thing
    } else {
      // do something when above conditions do not match
    }
    ```

    In Java SE 7 we can wrap it into a Switch Statement
     
    ```java
    switch(a) {
        case "apple":
            //do something
            break;
        case "orange":
            // do something
            break;
        case "pear":
            // do somethin
            break;
        default:
        // do something
          break;
    }
    ```

* Type Inference for Generic instance Creation (a.k.a Diamond)

    In Java SE 6 we can create a generic collection like a list of Strings in the following syntax 
    
    ```java
    List<String> strCollections = new ArrayList<String>();
    ```

    In Java SE 7 we can create the same list with a shorter syntax
    
    ```java
    List<String> strCollections = new ArrayList<>();
    ```

* Improved Compiler Warnings and Errors When Using Non-Reifiable Formal Parameters with Varargs Methods

    see http://docs.oracle.com/javase/7/docs/technotes/guides/language/non-reifiable-varargs.html for more details.

* Try-with-Resources

    Java SE 6

    ```java    
    BufferedReader br;
    try {
        br = new BufferedReader(...);
        br.readLine();
    } catch (IOException e) {
        // do something
    } finally {
        if (br != null) {
            br.close();
        }
    }
    ```

    Java SE 7

    ```java    
    try(BufferedReader br = new BufferedReader(...)) {
      br.readLine();
    } catch (IOException e) {
      // do something
    } 
    ```


* Catch Multiple Exception Types and Rethrowing with Improved Type Checking

    Java SE 6

    ```java
    Class string;
    try{
      string = Class.forName("java.lang.String");
      string.getMethod("length").invoke("some error");
    } catch(ClassNotFoundException cnfe) {
      System.out.println(cnfe.getMessage());
    } catch(IllegalAccessException iae1) {
      System.out.println(iae1.getMessage());
    } catch(IllegalArgumentException iae2) {
      System.out.println(iae2.getMessage());
    } catch(InvocationTargetException ite) {
      System.out.println(ite.getMessage());
    } catch(SecurityException se) {
      System.out.println(se.getMessage());
    } catch(NoSuchMethodException nsme) {
    System.out.println(nsme.getMessage());
    }
    ```

    Java SE 7

    ```java     
    try {
      Class s = Class.forName("java.lang.String");
      s.getMethod("length").invoke("some error");
    } catch (ClassNotFoundException | IllegalAccessException 
            | IllegalArgumentException | InvocationTargetException 
            | SecurityException | NoSuchMethodException e) {
      //Do something here
      System.out.println(e.getMessage());
    }
    ```

More details about Java SE 7 changes are available on the [Java SE 7 Features and Enhancements](http://www.oracle.com/technetwork/java/javase/jdk7-relnotes-418459.html), especially on the [Java Programming Language Enhancements](http://docs.oracle.com/javase/7/docs/technotes/guides/language/enhancements.html#javase7)

#### Can Android Support Java SE 7 Syntax?
According to [tools.android.com](http://tools.android.com/tech-docs/new-build-system/user-guide#TOC-Using-sourceCompatibility-1.7), you can use most of them with earlier version of Android with targetSDKVersion of 19 and set source compatibility to Java version 1.7, with the exception of **Try-with-resources** which you must use minSdkVersion of 19 (Android KitKat).



What's New in Java SE 8 Syntax
----------------------
* Lambda Expressions

  ```java
  processElements(
      roster,
      p -> p.getGender() == Person.Sex.MALE
          && p.getAge() >= 18
          && p.getAge() <= 25,
          p -> p.getEmailAddress(),
          email -> System.out.println(email)
  );
  ```
  
* Improved Type Inference
* Type Annotations and Pluggable Type Systems
* Repeating Annotations
* Method Parameter Reflection

More details of Java SE 8 can be referred to [What's New in JDK 8](http://www.oracle.com/technetwork/java/javase/8-whats-new-2157071.html)

#### Can Android Support Java SE 8 Syntax?
In short (at the time of this blog post), not at the moment, although you can try with unofficial/third party libraries, such as [gradle-retrolambda](https://github.com/evant/gradle-retrolambda) for lambda expressions :)
