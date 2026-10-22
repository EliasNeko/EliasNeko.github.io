/* 语言学习项目 · 数据源
   加一门语言要三步：
     1. 在这里加一条（open: true 才会变成可点的卡片）
     2. 在同一个文件夹里新建对应的页面，比如 java.html
     3. 在根目录「更新日志.txt」里写一句今天加了什么
   目录页会自动长出卡片，不用手写链接。 */

var LANGUAGES = [
    {
        id: "python",
        name: "Python",
        level: "零基础",
        tagline: "最像人话的一门语言",
        desc: "从「它是什么」讲到「你自己写一个项目」。数据分析、爬虫、自动化、AI，基本上都从这一门开始。",
        meta: "27 节 · 含 2 个动手项目 · 对应二级考证",
        file: "python.html",
        open: true
    },
    {
        id: "java",
        name: "Java",
        level: "零基础",
        tagline: "写一次，到处运行",
        desc: "从 JVM 讲到你自己写一个记账本。后端、安卓、大数据，国内大厂的后端一半是它。",
        meta: "28 节 · 含 2 个动手项目",
        file: "java.html",
        open: true
    }
];
