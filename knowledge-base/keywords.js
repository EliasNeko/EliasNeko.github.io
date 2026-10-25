/* ==========================================================
    关键词词典 · 数据
    字段：k 词条 / t 语言 / a 别名 / w 是什么 / u 怎么用
          c 能和谁搭 / x 代码 / o 输出说明
    新增词条：在数组里加一条即可。
    ========================================================== */

window.KEYWORDS = [
  /* ---------------- HTML ---------------- */
  {
    k: "<!DOCTYPE html>",
    t: "HTML",
    a: ["doctype", "文档类型", "文档声明"],
    w: "告诉浏览器「这是一份 HTML5 文档」的第一行声明。它不是标签，没有结束标签。",
    u: "永远写在文件第一行，前面不能有任何内容（连空行都不建议）。",
    c: ["<html>", "<head>"],
    x: `<!DOCTYPE html>
  <html lang="zh-CN">
    <head><title>我的店</title></head>
    <body><h1>你好</h1></body>
  </html>`,
    o: "浏览器进入「标准模式」，按 HTML5 规则解析；缺了它可能进入怪异模式，布局会莫名其妙。",
  },

  {
    k: "<html>",
    t: "HTML",
    a: ["html", "根元素"],
    w: "整个文档的根元素，所有内容都装在它里面。",
    u: "紧跟在 DOCTYPE 后面，通常加 lang 属性告诉浏览器页面语言。",
    c: ["<!DOCTYPE html>", "<head>", "<body>"],
    x: `<html lang="zh-CN">
    <head>…</head>
    <body>…</body>
  </html>`,
    o: 'lang="zh-CN" 让读屏软件用中文发音，也帮助搜索引擎判断语言。',
  },

  {
    k: "<head>",
    t: "HTML",
    a: ["head", "文档头"],
    w: "放「给浏览器看的信息」：编码、标题、样式表、脚本。这里的内容不会显示在页面上。",
    u: "写在 <html> 里、<body> 前面。",
    c: ["<title>", "<meta>", "<link>", "<style>"],
    x: `<head>
    <meta charset="UTF-8">
    <title>龙潜猫隐的咖啡店</title>
    <link rel="stylesheet" href="style.css">
  </head>`,
    o: "用户看不到这一块，但标签页标题、中文是否乱码、样式是否加载，全靠它。",
  },

  {
    k: "<body>",
    t: "HTML",
    a: ["body", "文档主体"],
    w: "页面上所有看得见的东西都放在这里。",
    u: "写在 <html> 里、<head> 后面。一个页面只有一个 body。",
    c: ["<header>", "<main>", "<footer>"],
    x: `<body>
    <h1>欢迎光临</h1>
    <p>一杯手冲的时间。</p>
  </body>`,
    o: "这两行文字会直接显示在浏览器窗口里。",
  },

  {
    k: "<title>",
    t: "HTML",
    a: ["title", "标题标签", "网页标题"],
    w: "定义浏览器**标签页**上显示的文字，也是收藏夹里默认保存的名字。",
    u: "写在 <head> 里，只能有一个，纯文本，不能放标签。",
    c: ["<head>", "<meta>"],
    x: `<head>
    <title>龙潜猫隐的咖啡店</title>
  </head>`,
    o: "浏览器顶部标签页显示「龙潜猫隐的咖啡店」；页面正文里不会出现这行字。",
  },

  {
    k: "<meta>",
    t: "HTML",
    a: ["meta", "元信息", "charset", "viewport"],
    w: "描述页面的元信息，最常见的是字符编码和手机视口设置。它是自闭合标签。",
    u: "写在 <head> 里，一个页面可以有好几个。",
    c: ["<head>", "<title>"],
    x: `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">`,
    o: "第一行保证中文不乱码；第二行让手机按屏幕真实宽度排版，否则整页会缩成一小块。",
  },

  {
    k: "<link>",
    t: "HTML",
    a: ["link", "外链", "样式表引入"],
    w: "把外部资源（通常是 CSS 文件）连到当前页面。自闭合标签。",
    u: "写在 <head> 里，rel 说明关系，href 写路径。",
    c: ["<head>", "rel", "href"],
    x: `<link rel="stylesheet" href="lesson.css">`,
    o: "页面加载时去取 lesson.css 并应用，改那一个文件，全站样式一起变。",
  },

  {
    k: "<script>",
    t: "HTML",
    a: ["script", "脚本", "js引入"],
    w: "引入或直接编写 JavaScript。",
    u: "外部脚本用 src，内部脚本直接写标签里；一般放在 </body> 前，保证元素已存在。",
    c: ["src", "</body>"],
    x: `<script src="lessons.js"></script>
  <script>
    console.log("页面加载完了");
  </script>`,
    o: "第一行加载外部 JS；第二行在控制台打印一句话（F12 → Console 可见）。",
  },

  {
    k: "<a>",
    t: "HTML",
    a: ["a", "链接", "超链接", "href"],
    w: "超链接，点了会跳到别的地方。",
    u: 'href 写目标：网址、本页锚点（#id）、文件路径、mailto。target="_blank" 新标签页打开。',
    c: ["href", "target", "id"],
    x: `<a href="#menu">看菜单</a>
  <a href="https://example.com" target="_blank" rel="noopener">外站</a>`,
    o: '第一个点了滚到 id="menu" 的位置；第二个在新标签页打开外站。',
  },

  {
    k: "<img>",
    t: "HTML",
    a: ["img", "图片", "src", "alt"],
    w: "插入图片。自闭合标签，靠 src 找图，靠 alt 描述图。",
    u: 'src 写路径，alt 写替代文字（必填），loading="lazy" 可以懒加载。',
    c: ["src", "alt", "width", "<figure>"],
    x: `<img src="coffee.jpg" alt="一杯拿铁" width="320" loading="lazy">`,
    o: "显示一张 320px 宽的图；图片加载失败时，位置会显示「一杯拿铁」这行字。",
  },

  {
    k: "<ul>",
    t: "HTML",
    a: ["ul", "无序列表", "li", "列表"],
    w: "无序列表（带小圆点），每一项用 <li> 包起来。",
    u: "导航栏、菜单、特性列表都适合用它。",
    c: ["<li>", "<ol>", "list-style"],
    x: `<ul>
    <li>拿铁</li>
    <li>美式</li>
  </ul>`,
    o: "竖着列出两项，每项前面一个小圆点；加 list-style: none 圆点消失。",
  },

  {
    k: "<div>",
    t: "HTML",
    a: ["div", "盒子", "块级容器"],
    w: "最普通的块级容器，本身没有任何语义，只用来分组和布局。",
    u: "需要「一个盒子」装东西时用它；能用 header/section 这类语义标签时优先用语义标签。",
    c: ["class", "id", "<span>"],
    x: `<div class="card">
    <h3>拿铁</h3>
    <p>¥ 28</p>
  </div>`,
    o: "屏幕上是一个独占一行的方块，具体长什么样由 .card 的 CSS 决定。",
  },

  {
    k: "<span>",
    t: "HTML",
    a: ["span", "行内容器"],
    w: "行内容器，用来给一小段文字单独加样式或挂事件。",
    u: "放在文字中间，不会换行。",
    c: ["class", "color"],
    x: `<p>今天喝了 <span style="color:#38bdf8">3</span> 杯。</p>`,
    o: "「3」显示为蓝色，和整句在同一行，不换行。",
  },

  {
    k: "<section>",
    t: "HTML",
    a: ["section", "区块", "分节"],
    w: "表示文档里的一个独立区块，通常带一个小标题。",
    u: "一个页面可以有很多 section，常配 id 做锚点跳转。",
    c: ["id", "<h2>", "<main>"],
    x: `<section id="menu">
    <h2>招牌咖啡</h2>
    <p>当天现烘的豆子。</p>
  </section>`,
    o: "形成一个可被 #menu 跳转到的区块，视觉上通常上下留白分隔。",
  },

  {
    k: "<nav>",
    t: "HTML",
    a: ["nav", "导航"],
    w: "表示一组导航链接。",
    u: "主导航、侧边目录、面包屑都可以用。里面通常是 ul + li + a。",
    c: ["<ul>", "<a>", "<header>"],
    x: `<nav>
    <a href="#menu">菜单</a>
    <a href="#story">故事</a>
  </nav>`,
    o: "屏幕阅读器会把这块识别为「导航区」，可以直接跳读。",
  },

  {
    k: "<button>",
    t: "HTML",
    a: ["button", "按钮", "type"],
    w: "可点击的按钮，比 div 更适合「点一下做事」。",
    u: '表单里默认会提交，不想提交就写 type="button"。',
    c: ["onclick", "type", "<form>"],
    x: `<button type="button" onclick="alert('已加入')">加入购物车</button>`,
    o: "点击后弹出提示框；按钮样式可用 CSS 完全改掉。",
  },

  {
    k: "<input>",
    t: "HTML",
    a: ["input", "输入框", "type", "placeholder"],
    w: "单行输入控件，靠 type 变身：文本、密码、数字、日期、颜色……自闭合标签。",
    u: "配 label 使用，placeholder 只是提示文字，不是值。",
    c: ["type", "placeholder", "<label>", "name"],
    x: `<label for="mail">邮箱</label>
  <input id="mail" type="email" placeholder="you@example.com" required>`,
    o: "出现一个带灰色提示的输入框；点「邮箱」两个字也能聚焦到框里；不填就提交会被浏览器拦下。",
  },

  {
    k: "<form>",
    t: "HTML",
    a: ["form", "表单", "action", "method"],
    w: "把一组输入控件打包提交给服务器。",
    u: "action 是提交地址，method 通常是 get 或 post。",
    c: ["<input>", "<button>", "action"],
    x: `<form action="/api/orders" method="post">
    <input name="item" value="拿铁">
    <button type="submit">下单</button>
  </form>`,
    o: "点「下单」后，浏览器把 item=拿铁 发送到 /api/orders。",
  },

  {
    k: "<label>",
    t: "HTML",
    a: ["label", "标签", "for"],
    w: "输入框的文字说明，点它等于点中对应的输入框。",
    u: "用 for 指向输入框的 id，或者把 input 直接包在 label 里面。",
    c: ["for", "id", "<input>"],
    x: `<label for="pwd">密码</label>
  <input id="pwd" type="password">`,
    o: "点「密码」两个字，光标会自动跳进输入框。",
  },

  {
    k: "<table>",
    t: "HTML",
    a: ["table", "表格", "tr", "td", "th"],
    w: "表格，用来展示行列数据。",
    u: "thead 放表头，tbody 放数据，th 是表头格，td 是数据格。",
    c: ["<tr>", "<td>", "<th>", "colspan"],
    x: `<table>
    <tr><th>产品</th><th>价格</th></tr>
    <tr><td>拿铁</td><td>28</td></tr>
  </table>`,
    o: "两行两列：第一行是加粗的表头，第二行是数据。",
  },

  {
    k: "<details>",
    t: "HTML",
    a: ["details", "折叠", "summary"],
    w: "自带展开/收起的折叠块，不用写一行 JS。",
    u: "summary 写标题，其余内容默认折叠。",
    c: ["<summary>"],
    x: `<details>
    <summary>配料表</summary>
    <p>咖啡豆、牛奶、水。</p>
  </details>`,
    o: "只看到「配料表」和一个三角箭头，点开才显示那行配料。",
  },

  {
    k: "class",
    t: "HTML",
    a: ["class", "类名", "类"],
    w: "给元素贴一个（或多个）标签名，用来让 CSS 选中它、让 JS 找到它。可以重复。",
    u: "一个元素可以写多个类，用空格分开。",
    c: ["选择器", "."],
    x: `<p class="card price">¥ 28</p>
  <style>.card { padding: 8px; } .price { color: #38bdf8; }</style>`,
    o: "这段文字同时获得内边距和蓝色，两个类各管一部分。",
  },

  {
    k: "id",
    t: "HTML",
    a: ["id", "唯一标识", "锚点"],
    w: "元素的唯一身份，全页只能有一个。可用于锚点跳转和 JS 精确查找。",
    u: "起名要具体，别用 item1、box2 这种。",
    c: ["#", "href", "getElementById"],
    x: `<section id="store">…</section>
  <a href="#store">去门店</a>`,
    o: "点链接后页面滚动到门店那一段，地址栏末尾出现 #store。",
  },

  {
    k: "data-*",
    t: "HTML",
    a: ["data", "自定义属性", "dataset"],
    w: "给元素存自定义数据，名字以 data- 开头，不影响显示。",
    u: "JS 里通过 element.dataset 读取，连字符会转驼峰。",
    c: ["dataset", "<button>"],
    x: `<button class="buy" data-name="拿铁" data-price="28">加入</button>
  <script>
    const b = document.querySelector(".buy");
    console.log(b.dataset.name, b.dataset.price);
  </script>`,
    o: "控制台输出「拿铁 28」；页面上看不出这些数据的存在。",
  },

  /* ---------------- CSS ---------------- */
  {
    k: "选择器",
    t: "CSS",
    a: ["selector", "选择器", "类选择器"],
    w: "CSS 的第一句话：选中谁。标签、类、id、属性、伪类都能当选择器。",
    u: "写上选择器，再用花括号包住声明。",
    c: ["class", "id", ":hover"],
    x: `p { color: #eee; }          /* 所有 p */
  .card { padding: 20px; }    /* class="card" */
  #app { margin: 0 auto; }    /* id="app" */`,
    o: "规则按选择器生效范围不同，优先级也不同（id > class > 标签）。",
  },

  {
    k: ":hover",
    t: "CSS",
    a: ["hover", "悬停", "鼠标经过"],
    w: "鼠标停在元素上时的状态，最常用的交互伪类。",
    u: "必须和选择器连写，中间不能有空格。",
    c: ["transition", "cursor"],
    x: `.btn { transition: 0.3s; }
  .btn:hover { background: #38bdf8; color: #04121f; }`,
    o: "平时是描边按钮，鼠标移上去变成实心蓝底，0.3 秒渐变过去。",
  },

  {
    k: "::before",
    t: "CSS",
    a: ["before", "伪元素", "after"],
    w: "在元素内容前面「凭空」插入一块内容，不用写真实标签。",
    u: "必须写 content（可以是空字符串），常配 position: absolute 画装饰。",
    c: ["content", "position", "inset"],
    x: `.card::before {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent, rgba(56,189,248,.12));
  }`,
    o: "卡片上多了一层几乎看不见的斜向蓝光；DOM 里并没有多出节点。",
  },

  {
    k: ":not()",
    t: "CSS",
    a: ["not", "否定伪类", "排除"],
    w: "排除掉符合条件的元素，剩下的才应用样式。",
    u: "括号里写选择器，可以连着写多个。",
    c: [":first-child", ":last-child"],
    x: `li { margin-top: 12px; }
  li:not(:first-child) { border-top: 1px solid #223; }`,
    o: "除第一项外，每一项上面多一条分隔线，第一项保持干净。",
  },

  {
    k: "flex",
    t: "CSS",
    a: ["flex", "弹性布局", "display:flex"],
    w: "一维布局：让子元素在一行（或一列）里排布、对齐、分配空间。",
    u: "写在父元素上；子元素用 flex: 1 平分，或用 gap 留缝。",
    c: ["justify-content", "align-items", "gap"],
    x: `.nav { display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 20px; }
  .links { display: flex; gap: 24px; }`,
    o: "logo 贴左、链接组贴右，整条导航垂直居中。",
  },

  {
    k: "grid",
    t: "CSS",
    a: ["grid", "网格布局", "display:grid"],
    w: "二维布局：同时控制行和列，做卡片墙最省事。",
    u: "父元素 display: grid，用 grid-template-columns 定义列数。",
    c: ["repeat", "minmax", "gap"],
    x: `.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
  }`,
    o: "窗口宽就三列、窄就两列、再窄一列，卡片自动重排，不用写媒体查询。",
  },

  {
    k: "position",
    t: "CSS",
    a: ["position", "定位", "absolute", "fixed", "sticky"],
    w: "决定元素怎么摆：正常流、相对自己偏移、相对祖先定位、钉在窗口、还是滚动时粘住。",
    u: "absolute 要找最近的 position 祖先；fixed 相对窗口；sticky 需要 top 值。",
    c: ["top", "left", "z-index"],
    x: `.box { position: relative; }
  .badge { position: absolute; top: 8px; right: 8px; }
  .nav { position: fixed; top: 0; left: 0; right: 0; }`,
    o: "角标贴在卡片右上角；导航条永远贴在窗口顶部，滚动不消失。",
  },

  {
    k: "z-index",
    t: "CSS",
    a: ["z-index", "层级", "谁在上面"],
    w: "控制重叠元素的上下顺序，数字越大越靠上。",
    u: "只对定位元素（relative/absolute/fixed/sticky）生效。",
    c: ["position"],
    x: `.nav { position: fixed; z-index: 10; }
  .modal { position: fixed; z-index: 100; }`,
    o: "弹窗盖住导航，导航又盖住页面内容。",
  },

  {
    k: "display",
    t: "CSS",
    a: ["display", "block", "inline", "none"],
    w: "元素的「性格」：独占一行、跟着文字走、还是不显示。",
    u: "最常用：block / inline-block / flex / grid / none。",
    c: ["flex", "grid", "visibility"],
    x: `.hide { display: none; }
  .row { display: flex; }`,
    o: "加 .hide 的元素完全消失，不占位置；display: flex 的元素内部变成弹性布局。",
  },

  {
    k: "box-sizing",
    t: "CSS",
    a: ["box-sizing", "border-box", "盒模型"],
    w: "决定 width 包不包括 padding 和 border。",
    u: "全局写成 border-box，宽度就是肉眼看到的宽度，算起来不头疼。",
    c: ["padding", "border", "width"],
    x: `* { box-sizing: border-box; }
  .box { width: 300px; padding: 20px; border: 1px solid #38bdf8; }`,
    o: "盒子总宽仍是 300px，内容区被压缩；不写这行的话，实际会变成 342px。",
  },

  {
    k: "margin",
    t: "CSS",
    a: ["margin", "外边距", "padding", "内边距"],
    w: "margin 是盒子外面的距离（推开别人），padding 是里面的距离（撑开自己）。",
    u: "四个值顺序：上 右 下 左；两个值时上下 / 左右。",
    c: ["padding", "gap"],
    x: `.card { margin-bottom: 20px; padding: 24px; }
  .hero { padding: 80px 24px; }`,
    o: "卡片之间空 20px，卡片内部四周空 24px；hero 上下 80px、左右 24px。",
  },

  {
    k: "border-radius",
    t: "CSS",
    a: ["border-radius", "圆角", "圆"],
    w: "把方角磨圆，值越大越圆。",
    u: "写 50% 是正圆（宽高相等时）；写 999px 是胶囊。",
    c: ["border", "width", "height"],
    x: `.avatar { width: 80px; height: 80px; border-radius: 50%; }
  .btn { padding: 10px 22px; border-radius: 999px; }`,
    o: "头像变成圆形；按钮两端变成半圆，像一颗胶囊。",
  },

  {
    k: "box-shadow",
    t: "CSS",
    a: ["box-shadow", "阴影", "投影"],
    w: "给盒子加投影，让画面有层次。",
    u: "四个值：水平偏移 垂直偏移 模糊 颜色；前面加 inset 变成内阴影。",
    c: ["transform", ":hover"],
    x: `.card { box-shadow: 0 20px 40px rgba(2,6,15,.55); }
  .card:hover { box-shadow: 0 28px 60px rgba(2,6,15,.7); }`,
    o: "卡片下方有一圈柔和的黑影，悬停时影子更大，像被抬起来。",
  },

  {
    k: "background",
    t: "CSS",
    a: ["background", "背景", "background-image", "cover"],
    w: "元素的背景：颜色、图片、渐变都归它管。",
    u: "简写顺序：颜色 图片 位置 / 尺寸 重复。",
    c: ["linear-gradient", "background-size"],
    x: `.hero {
    background: #070c17 url("bg.jpg") center / cover no-repeat;
  }`,
    o: "图片铺满整个区域、居中、不重复，多出来的部分被裁掉。",
  },

  {
    k: "linear-gradient",
    t: "CSS",
    a: ["linear-gradient", "渐变", "径向渐变", "radial-gradient"],
    w: "线性渐变：颜色沿着一条线过渡。",
    u: "第一个参数是角度或方向，后面是颜色停靠点。",
    c: ["background", "to right"],
    x: `.btn { background: linear-gradient(120deg, #0ea5e9, #38bdf8); }
  .glow { background: radial-gradient(circle at 50% 0%, #1e3a5f, transparent 70%); }`,
    o: "按钮是斜向的深浅蓝；glow 是一团从顶部中心散开的柔光。",
  },

  {
    k: "transition",
    t: "CSS",
    a: ["transition", "过渡", "动画"],
    w: "让属性的变化「慢慢来」，而不是瞬间跳变。",
    u: "写清楚变什么、变多久；all 表示所有可动画属性。",
    c: [":hover", "transform", ":focus"],
    x: `.btn { transition: background 0.3s, transform 0.3s; }
  .btn:hover { transform: translateY(-3px); }`,
    o: "鼠标移上去，按钮用 0.3 秒缓缓上浮 3px，而不是瞬间跳上去。",
  },

  {
    k: "transform",
    t: "CSS",
    a: ["transform", "位移", "旋转", "缩放", "translate"],
    w: "对元素做位移、旋转、缩放、倾斜，不影响周围布局。",
    u: "多个变换用空格连写，顺序会影响结果。",
    c: ["transition", "scale", "rotate"],
    x: `.card:hover { transform: translateY(-6px) scale(1.02); }
  .icon { transform: rotate(45deg); }`,
    o: "悬停时卡片微微上浮并放大 2%；图标旋转 45 度。",
  },

  {
    k: "animation",
    t: "CSS",
    a: ["animation", "动画", "keyframes", "关键帧"],
    w: "按关键帧自动播放的动画，不需要鼠标触发。",
    u: "先定义 @keyframes，再用 animation 引用：名字 时长 缓动 循环。",
    c: ["@keyframes", "infinite"],
    x: `@keyframes float {
    50% { transform: translateY(-10px); }
  }
  .dot { animation: float 3s ease-in-out infinite; }`,
    o: "小圆点会循环上下浮动，3 秒一个来回，无限次。",
  },

  {
    k: "@media",
    t: "CSS",
    a: ["media", "媒体查询", "响应式", "手机适配"],
    w: "当屏幕满足某个条件时，才应用这一组样式。",
    u: "常用 max-width（小于）或 min-width（大于）。",
    c: ["grid", "display", "viewport"],
    x: `@media (max-width: 860px) {
    .layout { grid-template-columns: 1fr; }
    .toc { display: none; }
  }`,
    o: "窗口窄于 860px 时，两栏变一栏、侧边目录隐藏；宽屏下恢复原样。",
  },

  {
    k: "var()",
    t: "CSS",
    a: ["var", "css变量", "自定义属性", ":root"],
    w: "使用 CSS 变量。变量在 :root 里定义一次，到处引用。",
    u: "定义写 --名字: 值；使用写 var(--名字)。",
    c: [":root", "--accent"],
    x: `:root { --accent: #38bdf8; }
  .btn { color: var(--accent); border: 1px solid var(--accent); }`,
    o: "只要改 :root 里的那一个值，按钮文字和描边同时变色。",
  },

  {
    k: "backdrop-filter",
    t: "CSS",
    a: ["backdrop-filter", "毛玻璃", "模糊"],
    w: "把元素「背后的内容」模糊掉，做出毛玻璃效果。",
    u: "需要背景本身半透明，效果才明显。",
    c: ["background", "blur"],
    x: `.nav {
    background: rgba(7,12,23,.68);
    backdrop-filter: blur(14px);
  }`,
    o: "导航条半透明，滚动时下面的文字从它背后经过，被虚化成一片雾。",
  },

  /* ---------------- JavaScript ---------------- */
  {
    k: "let",
    t: "JavaScript",
    a: ["let", "const", "变量"],
    w: "声明变量：let 可以重新赋值，const 声明后不能再指向别的值。",
    u: "默认用 const，确实要改才用 let；不要用 var。",
    c: ["const", "="],
    x: `const price = 28;
  let count = 0;
  count = count + 1;
  console.log(count, price);`,
    o: "控制台输出「1 28」。若给 price 重新赋值，控制台会报错。",
  },

  {
    k: "function",
    t: "JavaScript",
    a: ["function", "函数", "箭头函数", "=>"],
    w: "把一段逻辑装进盒子并起名，随时调用。",
    u: "函数声明会被提升；箭头函数更短，常配合数组方法使用。",
    c: ["return", "=>", "const"],
    x: `function add(a, b) { return a + b; }
  const twice = n => n * 2;
  console.log(add(2, 3), twice(4));`,
    o: "输出「5 8」：第一个函数返回和，第二个箭头函数返回两倍。",
  },

  {
    k: "if",
    t: "JavaScript",
    a: ["if", "else", "条件", "判断"],
    w: "按条件决定走哪条路。",
    u: "条件为真执行 if 块，否则走 else；多个条件用 else if。",
    c: ["else", "===", "&&"],
    x: `const n = 5;
  if (n > 10) console.log("多");
  else if (n > 0) console.log("有");
  else console.log("空");`,
    o: "输出「有」，因为 5 不大于 10，但大于 0。",
  },

  {
    k: "forEach",
    t: "JavaScript",
    a: ["forEach", "循环", "for", "遍历"],
    w: "遍历数组的每一项，对每一项执行一次函数。",
    u: "没有返回值，只是「对每个都做点什么」。",
    c: ["map", "filter", "push"],
    x: `["拿铁", "美式"].forEach(function (item, i) {
    console.log(i, item);
  });`,
    o: "输出两行：「0 拿铁」「1 美式」——索引从 0 开始。",
  },

  {
    k: "map",
    t: "JavaScript",
    a: ["map", "映射", "数组方法"],
    w: "把数组每一项「变换」成新值，返回一个新数组，原数组不变。",
    u: "常用来把数据变成 HTML 字符串。",
    c: ["join", "filter", "=>"],
    x: `const prices = [28, 30];
  const doubled = prices.map(p => p * 2);
  console.log(doubled);`,
    o: "输出「[56, 60]」，原数组 prices 还是 [28, 30]。",
  },

  {
    k: "filter",
    t: "JavaScript",
    a: ["filter", "筛选", "过滤"],
    w: "按条件筛选数组，返回符合条件的新数组。",
    u: "回调返回 true 就保留，false 就丢掉。",
    c: ["map", "find", "length"],
    x: `const prices = [28, 30, 22];
  const cheap = prices.filter(p => p < 25);
  console.log(cheap);`,
    o: "输出「[22]」；只留下小于 25 的那一个。",
  },

  {
    k: "querySelector",
    t: "JavaScript",
    a: ["querySelector", "选择元素", "dom", "getElementById"],
    w: "按 CSS 选择器找到页面上的元素，返回第一个匹配的。",
    u: "要拿全部用 querySelectorAll，得到的是类数组，可以 forEach 遍历。",
    c: ["textContent", "addEventListener", "classList"],
    x: `<p class="tip">你好</p>
  <script>
    const el = document.querySelector(".tip");
    el.textContent = "你好，小鱼";
  </script>`,
    o: "页面上的「你好」变成「你好，小鱼」——文字被 JS 改掉了。",
  },

  {
    k: "addEventListener",
    t: "JavaScript",
    a: ["addEventListener", "事件", "监听", "onclick"],
    w: "给元素绑定事件：点击、输入、滚动、键盘……",
    u: "第一个参数是事件名（不带 on），第二个是处理函数。",
    c: ["click", "preventDefault", "e.target"],
    x: `const btn = document.querySelector("#buy");
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("点了", e.target);
  });`,
    o: "每点一次按钮，控制台就打印一行，同时阻止按钮的默认行为。",
  },

  {
    k: "classList",
    t: "JavaScript",
    a: ["classList", "切换类", "add", "remove", "toggle"],
    w: "增删切换元素上的 class，是最轻量的「改样式」方式。",
    u: "add 加、remove 删、toggle 切、contains 查。",
    c: ["class", "toggle", "风格切换"],
    x: `const box = document.querySelector(".card");
  box.classList.add("active");
  box.classList.toggle("dark");`,
    o: "卡片先多了一个 active 类（触发 CSS 里的 .active 样式），再切换 dark 类的有无。",
  },

  {
    k: "localStorage",
    t: "JavaScript",
    a: ["localStorage", "本地存储", "存数据"],
    w: "把数据存在浏览器里，关掉页面再打开还在。",
    u: "只能存字符串，对象要先 JSON.stringify。",
    c: ["JSON.stringify", "getItem", "购物车"],
    x: `localStorage.setItem("cups", "3");
  const n = localStorage.getItem("cups");
  console.log(n);`,
    o: "控制台输出字符串「3」；关掉浏览器再打开，这个值仍然在。",
  },

  {
    k: "JSON",
    t: "JavaScript",
    a: ["json", "stringify", "parse", "序列化"],
    w: "JSON 是数据格式；stringify 把对象转成字符串，parse 把字符串转回对象。",
    u: "存 localStorage、发请求时几乎必用。",
    c: ["localStorage", "fetch", "对象"],
    x: `const cart = [{ name: "拿铁", price: 28 }];
  const text = JSON.stringify(cart);
  console.log(text);
  console.log(JSON.parse(text)[0].name);`,
    o: "先输出一段 JSON 字符串，再输出「拿铁」——数据来回转换没有丢。",
  },

  {
    k: "fetch",
    t: "JavaScript",
    a: ["fetch", "请求", "接口", "ajax"],
    w: "向服务器发请求，拿到数据后做下一步。",
    u: "返回 Promise，用 then 或 await 接；POST 时要写 method、headers、body。",
    c: ["async", "await", "JSON"],
    x: `fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item: "拿铁" })
  })
    .then(r => r.json())
    .then(d => console.log(d));`,
    o: "后端收到订单后返回 JSON，前端在控制台打印出来。",
  },

  {
    k: "setTimeout",
    t: "JavaScript",
    a: ["setTimeout", "延时", "定时器", "setInterval"],
    w: "延迟一段时间后执行一次；setInterval 是每隔一段时间执行。",
    u: "单位是毫秒。定时器要记得在合适的时候清掉。",
    c: ["setInterval", "clearTimeout"],
    x: `setTimeout(() => console.log("3 秒"), 3000);
  const t = setInterval(() => console.log("每秒"), 1000);
  clearInterval(t);`,
    o: "3 秒后打印一次「3 秒」；第二行本来每秒打印，但立刻被清掉，所以一次都没打。",
  },
];
