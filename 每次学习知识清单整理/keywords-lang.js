/* 语言关键词补充 —— 和 keywords.js 合并成一词典
   字段同 keywords.js：k 词条 / t 语言 / a 别名 / w 是什么 / u 怎么用 / c 搭配 / x 代码 / o 说明 */

(function () {
  "use strict";
  if (!window.KEYWORDS) window.KEYWORDS = [];

  var MORE = [
    {k:"def", t:"Python", a:["定义函数"],
     w:"用 def 定义一个函数，冒号后面缩进就是函数体。",
     u:"def 名字(参数): 下面缩进写逻辑；需要结果就 return。",
     c:["return","缩进"],
     x:`
    def greet(name):
        return "你好，" + name`,
     o:"调用 greet(\"阿猫\") 得到「你好，阿猫」。"},

    {k:"列表推导式", t:"Python", a:["list","comprehension"],
     w:"一行把列表里的每个元素处理一遍，生成新列表。",
     u:"[表达式 for 变量 in 可迭代对象 if 条件]",
     c:["for","列表"],
     x:`
    nums = [1, 2, 3]
    squares = [n * n for n in nums]`,
     o:"squares 是 [1, 4, 9]。"},

    {k:"dict", t:"Python", a:["字典","键值对"],
     w:"用键取值的数据结构，键必须唯一。",
     u:"d = {\"咖啡\": 32}；取值 d[\"咖啡\"]，没有这个键会报 KeyError。",
     c:["keys","items"],
     x:`
    stock = {"咖啡": 10}
    print(stock.get("茶", 0))`,
     o:"get 取不到时返回默认值 0，不会报错。"},

    {k:"try / except", t:"Python", a:["异常处理"],
     w:"把可能出错的代码包起来，出错时走 except，程序不崩。",
     u:"try: ... except 异常类型 as e: ...；能精确就写具体类型，别裸 except。",
     c:["raise","finally"],
     x:`
    try:
        n = int(input())
    except ValueError:
        print("请输入数字")`,
     o:"输入字母时打印提示，不会抛异常退出。"},

    {k:"with", t:"Python", a:["上下文管理器"],
     w:"打开文件用完自动关闭，不用手写 close。",
     u:"with open(路径, 模式) as f: 下面缩进读写。",
     c:["open","文件"],
     x:`
    with open("a.txt", "r", encoding="utf-8") as f:
        print(f.read())`,
     o:"代码块结束自动关闭文件，即使中途报错。"},

    {k:"import", t:"Python", a:["导入模块"],
     w:"把别的文件或标准库拿进来用。",
     u:"import 模块；from 模块 import 名字；as 起别名。",
     c:["pip","模块"],
     x:`
    import math
    print(math.sqrt(16))`,
     o:"输出 4.0。"},

    {k:"类与 self", t:"Python", a:["class"],
     w:"class 定义类，方法第一个参数写 self，代表这个对象自己。",
     u:"class 名字: 下面 def __init__(self, ...) 初始化。",
     c:["__init__","对象"],
     x:`
    class Coffee:
        def __init__(self, name):
            self.name = name`,
     o:"c = Coffee(\"耶加\") 之后 c.name 就是「耶加」。"},

    {k:"切片", t:"Python", a:["slice"],
     w:"用 [start:stop:step] 取列表或字符串的一段，含头不含尾。",
     u:"a[1:3] 取下标 1、2；a[::-1] 反转。",
     c:["列表","字符串"],
     x:`
    s = "abcdef"
    print(s[1:4])`,
     o:"输出 bcd。"},

    {k:"public static void main", t:"Java", a:["主方法"],
     w:"Java 程序的入口，JVM 从这里开始执行。",
     u:"签名一个字符都不能错，写在 class 里面。",
     c:["class","String[] args"],
     x:`
    public static void main(String[] args) {
        System.out.println("你好");
    }`,
     o:"运行这个类会打印「你好」。"},

    {k:"new", t:"Java", a:["创建对象"],
     w:"用 new 调构造方法，在堆上创建一个对象。",
     u:"类名 变量 = new 类名(参数);",
     c:["构造方法","对象"],
     x:`
    Coffee c = new Coffee("耶加", 32);`,
     o:"c 指向新对象，可以调用它的方法。"},

    {k:"extends", t:"Java", a:["继承"],
     w:"子类继承父类的字段和方法，只能单继承。",
     u:"class 子类 extends 父类 { ... }",
     c:["super","重写"],
     x:`
    class Latte extends Coffee {
        Latte() { super("拿铁", 28); }
    }`,
     o:"Latte 自动拥有 Coffee 的字段和方法。"},

    {k:"interface", t:"Java", a:["接口"],
     w:"只定义「能做什么」，不写具体实现；一个类可以实现多个接口。",
     u:"interface 名字 { 返回类型 方法(); }；类用 implements。",
     c:["implements","抽象"],
     x:`
    interface Pay { void pay(int n); }`,
     o:"实现类必须写出 pay 方法，否则编译不过。"},

    {k:"ArrayList", t:"Java", a:["动态数组"],
     w:"长度可变的数组，add 添加、get 按下标取。",
     u:"new ArrayList<>()；遍历用 for (类型 x : list)。",
     c:["List","泛型"],
     x:`
    ArrayList<String> list = new ArrayList<>();
    list.add("咖啡");`,
     o:"list.get(0) 是「咖啡」。"},

    {k:"try / catch", t:"Java", a:["异常处理"],
     w:"捕获异常，避免程序直接退出。",
     u:"try { ... } catch (异常类型 e) { ... } finally { ... }",
     c:["throw","throws"],
     x:`
    try {
        int n = Integer.parseInt("abc");
    } catch (NumberFormatException e) {
        System.out.println("不是数字");
    }`,
     o:"打印「不是数字」，程序继续跑。"},

    {k:"== 和 equals", t:"Java", a:["比较"],
     w:"== 比的是「是不是同一个对象」，equals 比的是「内容是否相同」。",
     u:"字符串比较一律用 equals，常量写前面防空指针。",
     c:["String","null"],
     x:`
    String a = new String("x");
    String b = new String("x");
    a == b        // false
    a.equals(b)   // true`,
     o:"这就是「两个内容一样的字符串却不 ==」的经典坑。"},

    {k:"泛型", t:"Java", a:["generics"],
     w:"给集合规定元素类型，编译期就能查出类型错误。",
     u:"List<String> 只能放 String；不要用原始类型 List。",
     c:["ArrayList","类型"],
     x:`
    List<Integer> nums = new ArrayList<>();`,
     o:"nums.add(\"abc\") 会直接编译报错。"},

    {k:"指针", t:"C", a:["pointer"],
     w:"存的是地址，不是值。* 取值，& 取地址。",
     u:"int *p = &a; 之后 *p 就是 a。",
     c:["&","数组"],
     x:`
    int a = 10;
    int *p = &a;
    printf("%d", *p);`,
     o:"输出 10；改 *p 等于改 a。"},

    {k:"malloc / free", t:"C", a:["动态内存"],
     w:"在堆上申请和释放内存，必须成对出现。",
     u:"malloc 返回 void*，要强转；用完 free，释放后别再访问。",
     c:["堆","内存泄漏"],
     x:`
    int *p = (int *)malloc(sizeof(int) * 10);
    free(p);`,
     o:"忘了 free 就是内存泄漏；free 后还用就是野指针。"},

    {k:"struct", t:"C", a:["结构体"],
     w:"把几个不同类型的数据打包成一个整体。",
     u:"struct 名字 { 字段; }; 用 . 访问，指针用 ->。",
     c:["typedef","->"],
     x:`
    struct Coffee { char name[20]; int price; };`,
     o:"struct Coffee c; c.price = 32;"},

    {k:"scanf 的 &", t:"C", a:["输入"],
     w:"scanf 要的是地址，普通变量前必须加 &。",
     u:"scanf(\"%d\", &n)；字符串数组不用加 &。",
     c:["printf","输入"],
     x:`
    int n;
    scanf("%d", &n);`,
     o:"漏掉 & 轻则读不到，重则程序直接崩。"},

    {k:"字符串结尾的 \\0", t:"C", a:["字符串"],
     w:"C 的字符串是字符数组，以 \\0 结尾，函数靠它判断结束。",
     u:"char s[6] = \"hello\"; 实际占 6 个字节。",
     c:["char","strlen"],
     x:`
    char s[] = "hi";
    printf("%d", (int)sizeof(s));`,
     o:"输出 3：h、i、\\0 各一个字节。"},

    {k:"数组与指针", t:"C", a:["array"],
     w:"数组名在大多数场合会退化成首元素地址，所以能当指针用。",
     u:"a[i] 等价于 *(a + i)。",
     c:["指针","下标"],
     x:`
    int a[3] = {1, 2, 3};
    printf("%d", *(a + 1));`,
     o:"输出 2。"},

    {k:"let / const", t:"JavaScript", a:["声明变量"],
     w:"let 可以改，const 不能重新赋值；都只在块里有效。",
     u:"默认用 const，确实要改再用 let，别用 var。",
     c:["作用域","var"],
     x:`
    const price = 32;
    let count = 0;
    count++;`,
     o:"const 变量重新赋值会直接报错。"},

    {k:"JSON.stringify / parse", t:"JavaScript", a:["序列化"],
     w:"对象转字符串、字符串转对象，localStorage 和接口都靠它。",
     u:"stringify 存之前，parse 读之后，记得 try/catch。",
     c:["localStorage","对象"],
     x:`
    const s = JSON.stringify({a: 1});
    const o = JSON.parse(s);`,
     o:"o.a 是 1；解析坏数据会抛异常。"},

    {k:"map / filter", t:"JavaScript", a:["数组方法"],
     w:"map 把每个元素变一次，filter 按条件筛，都返回新数组。",
     u:"arr.map(x => x * 2)；arr.filter(x => x > 0)",
     c:["数组","箭头函数"],
     x:`
    [1, 2, 3].map(n => n * 2)   // [2, 4, 6]`,
     o:"原数组不变，别拿返回值当原地修改。"},

    {k:"闭包", t:"JavaScript", a:["closure"],
     w:"函数记住了它定义时所在的作用域，外面访问不到里面的变量。",
     u:"常见于计数器、循环绑定事件。",
     c:["作用域","函数"],
     x:`
    function counter() {
        let n = 0;
        return () => ++n;
    }`,
     o:"每次调用返回的函数，n 都还在，且各算各的。"},

    {k:"async / await", t:"JavaScript", a:["异步"],
     w:"用同步的写法等异步结果，await 只能在 async 函数里用。",
     u:"await 一个 Promise；出错用 try/catch 接。",
     c:["Promise","fetch"],
     x:`
    async function load() {
        const res = await fetch("/api/list");
        return res.json();
    }`,
     o:"不写 await 拿到的是 Promise，不是数据。"},

    {k:"SELECT", t:"SQL", a:["查询"],
     w:"从表里取数据，最基本的语句。",
     u:"SELECT 列 FROM 表 WHERE 条件 ORDER BY 列 LIMIT n;",
     c:["FROM","WHERE"],
     x:`
    SELECT name, price FROM orders WHERE price > 20;`,
     o:"返回价格大于 20 的那些行。"},

    {k:"WHERE", t:"SQL", a:["筛选"],
     w:"按条件过滤行，支持 AND / OR / LIKE / IN。",
     u:"字符串要加单引号；NULL 用 IS NULL 判断。",
     c:["SELECT","NULL"],
     x:`
    SELECT * FROM orders WHERE name = '阿猫';`,
     o:"只返回阿猫的订单。"},

    {k:"JOIN", t:"SQL", a:["连接"],
     w:"把两张表按关联列接起来，默认是 INNER JOIN。",
     u:"JOIN 表 ON 条件；保留左表全部用 LEFT JOIN。",
     c:["ON","外键"],
     x:`
    SELECT o.item, u.phone
    FROM orders o JOIN users u ON u.name = o.name;`,
     o:"忘了 ON 会变成笛卡尔积，行数爆炸。"},

    {k:"GROUP BY", t:"SQL", a:["分组"],
     w:"按某列分组，配合 COUNT / SUM / AVG 做统计。",
     u:"SELECT 列, COUNT(*) FROM 表 GROUP BY 列;",
     c:["COUNT","HAVING"],
     x:`
    SELECT item, COUNT(*) FROM orders GROUP BY item;`,
     o:"每种商品一行，后面是卖出杯数。"},

    {k:"索引", t:"SQL", a:["index"],
     w:"像书的目录，让查询不用扫全表；代价是写入变慢。",
     u:"CREATE INDEX 名 ON 表(列); 用 EXPLAIN 看有没有走上。",
     c:["EXPLAIN","性能"],
     x:`
    CREATE INDEX idx_name ON orders (name);`,
     o:"在索引列上套函数（YEAR(created)）会让它失效。"},

    {k:"事务", t:"SQL", a:["transaction"],
     w:"一组要么全成功、要么全回滚的操作。",
     u:"START TRANSACTION; ... COMMIT; 出错 ROLLBACK;",
     c:["COMMIT","ROLLBACK"],
     x:`
    START TRANSACTION;
    UPDATE accounts SET balance = balance - 32 WHERE name = "阿猫";
    COMMIT;`,
     o:"转账这种两边一起变的操作必须用它。"},

    {k:"commit", t:"Git", a:["提交"],
     w:"把暂存区的内容记进本地历史，一次提交一个快照。",
     u:"git add 之后 git commit -m \"说明\"；说明写清「为什么改」。",
     c:["add","log"],
     x:`
    git add .
    git commit -m "修复登录跳转"`,
     o:"git log 里会多一条记录。"},

    {k:"branch", t:"Git", a:["分支"],
     w:"从当前点分出一条线，改动互不影响。",
     u:"git switch -c 名字 新建并切过去；git branch 看列表。",
     c:["merge","switch"],
     x:`
    git switch -c feature`,
     o:"之后在 feature 上的提交不影响 main。"},

    {k:"合并冲突", t:"Git", a:["conflict"],
     w:"两边改了同一段，Git 不知道留哪个，就把两个版本都写进文件。",
     u:"手动改成想要的样子，删掉 <<<<<<< ======= >>>>>>>，再 add + commit。",
     c:["merge","rebase"],
     x:`
    <<<<<<< HEAD
    你的版本
    =======
    对方版本
    >>>>>>> feature`,
     o:"冲突标记没删干净就提交，代码里会留下这些符号。"},

    {k:".gitignore", t:"Git", a:["忽略文件"],
     w:"告诉 Git 哪些文件不要提交，比如密码、依赖目录。",
     u:"一行一个规则；已被跟踪的文件要先 git rm --cached。",
     c:["node_modules","密钥"],
     x:`
    node_modules/
    .env
    server/admin.key`,
     o:"这些文件不会出现在仓库里。"},

    {k:"require", t:"Node.js", a:["引入模块"],
     w:"CommonJS 的引入方式，返回 module.exports 的内容。",
     u:"const x = require(\"./x\")；本地文件必须带 ./。",
     c:["module.exports","npm"],
     x:`
    const fs = require("fs");`,
     o:"少了 ./ 会去 node_modules 找，报找不到模块。"},

    {k:"npm install", t:"Node.js", a:["装包"],
     w:"按 package.json 装依赖，生成 node_modules。",
     u:"npm install 包名；--save-dev 装开发依赖。",
     c:["package.json","node_modules"],
     x:`
    npm install express`,
     o:"装完 package.json 的 dependencies 会多一行。"},

    {k:"express.json()", t:"Node.js", a:["中间件"],
     w:"让 Express 解析 JSON 请求体，不写它 req.body 永远是 undefined。",
     u:"app.use(express.json()); 放在路由前面。",
     c:["Express","POST"],
     x:`
    app.use(express.json());`,
     o:"这是「POST 收不到数据」最常见的原因。"},

    {k:"goroutine", t:"Go", a:["协程"],
     w:"go 关键字起一条轻量线程，调度由 Go 运行时管。",
     u:"go 函数()；配合 WaitGroup 等它结束。",
     c:["channel","并发"],
     x:`
    go func() {
        fmt.Println("跑起来了")
    }()`,
     o:"主函数退出时，没跑完的 goroutine 会被一起结束。"},

    {k:"channel", t:"Go", a:["通道"],
     w:"goroutine 之间传数据用的管道，取代共享内存加锁。",
     u:"ch := make(chan 类型)；ch <- v 发，<-ch 收。",
     c:["goroutine","select"],
     x:`
    ch := make(chan int)
    go func() { ch <- 1 }()
    fmt.Println(<-ch)`,
     o:"没缓冲的 channel 发送和接收必须同时就绪。"},

    {k:"defer", t:"Go", a:["延迟执行"],
     w:"函数返回前才执行，常用来关文件、解锁。",
     u:"defer f.Close() 写在打开之后。",
     c:["Close","panic"],
     x:`
    f, _ := os.Open("a.txt")
    defer f.Close()`,
     o:"即使后面 panic，defer 也会执行。"},

    {k:"所有权", t:"Rust", a:["ownership"],
     w:"每个值只有一个主人，主人离开作用域值就释放。",
     u:"赋值给别的变量 = 移动，原变量作废；想共用就借用。",
     c:["借用","move"],
     x:`
    let a = String::from("x");
    let b = a;
    // a 不能再用`,
     o:"编译期就拦住「两个地方同时释放」。"},

    {k:"借用", t:"Rust", a:["borrow"],
     w:"用 & 只读借、&mut 可写借，同一时间只能有一种。",
     u:"多个只读可以共存；可写借用期间不能有别的借用。",
     c:["&mut","生命周期"],
     x:`
    fn len(s: &String) -> usize { s.len() }`,
     o:"借用不夺走所有权，函数返回后原变量还能用。"},

    {k:"Result", t:"Rust", a:["错误处理"],
     w:"可能失败的操作返回 Ok(值) 或 Err(错误)，不用异常。",
     u:"match 处理，或用 ? 往上抛；少用 unwrap。",
     c:["?","Option"],
     x:`
    let text = fs::read_to_string("a.txt")?;`,
     o:"? 遇到 Err 会立刻返回，只适用于返回 Result 的函数。"}
  ];

  Array.prototype.push.apply(window.KEYWORDS, MORE);
})();