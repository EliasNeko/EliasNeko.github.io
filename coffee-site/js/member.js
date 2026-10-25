/* 会员系统的小工具箱
    —— 算密码哈希、加密名单、读写本机记录。
   本机记录（含密码）只存在你浏览器里；公开名单只放「用户名 + 盐 + 哈希」。 */
var Member = (function () {
  "use strict";

  var USERS_KEY = "coffee-users-local"; /* 本机完整记录 */
  var PUBLIC_KEY = "coffee-public-local"; /* 本机生成的公开条目 */
  var SESSION_KEY = "coffee-session";
  var DEVICE_KEY = "coffee-device-id";
  var ITER_HASH = 100000; /* 密码哈希迭代次数 */
  var ITER_ENC = 150000; /* 名单加密迭代次数 */

  function bytesToHex(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      var h = bytes[i].toString(16);
      out += h.length === 1 ? "0" + h : h;
    }
    return out;
  }

  function hexToBytes(hex) {
    var len = hex.length / 2;
    var out = new Uint8Array(len);
    for (var i = 0; i < len; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function toBase64(buf) {
    var bytes = new Uint8Array(buf);
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function fromBase64(str) {
    var s = atob(str);
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function randomHex(n) {
    var b = new Uint8Array(n);
    crypto.getRandomValues(b);
    return bytesToHex(b);
  }

  function ok() {
    return !!(window.crypto && window.crypto.subtle);
  }

  /* 把口令变成哈希：同样的口令 + 同样的盐，永远得到同样的结果 */
  function hashPass(pass, saltHex) {
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"])
      .then(function (base) {
        return crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: hexToBytes(saltHex),
            iterations: ITER_HASH,
            hash: "SHA-256",
          },
          base,
          256,
        );
      })
      .then(function (bits) {
        return bytesToHex(new Uint8Array(bits));
      });
  }

  /* 把口令变成 AES 钥匙（加密 / 解密名单用） */
  function deriveAesKey(pass, saltHex, usage) {
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: hexToBytes(saltHex),
            iterations: ITER_ENC,
            hash: "SHA-256",
          },
          base,
          { name: "AES-GCM", length: 256 },
          false,
          [usage],
        );
      });
  }

  /* 加密：返回一个可以直接存成 users.enc.json 的对象 */
  function encryptList(list, passphrase) {
    var salt = randomHex(16);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var enc = new TextEncoder();

    return deriveAesKey(passphrase, salt, "encrypt")
      .then(function (key) {
        return crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv },
          key,
          enc.encode(JSON.stringify(list)),
        );
      })
      .then(function (cipher) {
        return {
          v: 1,
          alg: "PBKDF2-SHA256+AES-GCM",
          iter: ITER_ENC,
          salt: salt,
          iv: toBase64(iv),
          data: toBase64(cipher),
          saved: new Date().toISOString(),
        };
      });
  }

  /* 解密：把 users.enc.json 还原成数组 */
  function decryptList(fileObj, passphrase) {
    return deriveAesKey(passphrase, fileObj.salt, "decrypt")
      .then(function (key) {
        return crypto.subtle.decrypt(
          { name: "AES-GCM", iv: fromBase64(fileObj.iv) },
          key,
          fromBase64(fileObj.data),
        );
      })
      .then(function (plain) {
        return JSON.parse(new TextDecoder().decode(plain));
      });
  }

  /* ---------- 本机读写 ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function deviceId() {
    var id = null;
    try {
      id = localStorage.getItem(DEVICE_KEY);
    } catch (e) {}
    if (!id) {
      id =
        "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      try {
        localStorage.setItem(DEVICE_KEY, id);
      } catch (e) {}
    }
    return id;
  }

  function nowStr() {
    var d = new Date();
    function pad(n) {
      return n < 10 ? "0" + n : "" + n;
    }
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  function localUsers() {
    return read(USERS_KEY, []);
  }
  function publicEntries() {
    return read(PUBLIC_KEY, []);
  }
  function session() {
    return read(SESSION_KEY, null);
  }

  function saveSession(name, hash) {
    return write(SESSION_KEY, { name: name, time: nowStr(), hash: hash || "" });
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  /* 把一条本机记录拆成「公开条目」：只留用户名、盐、哈希、时间 */
  function toPublic(user) {
    return {
      name: user.name,
      salt: user.salt,
      hash: user.hash,
      created: user.created,
    };
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /* ---------- 站长头衔 ---------- */
  var OWNER_NAME = "龙潜猫隐";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function isOwner(name) {
    return String(name == null ? "" : name).trim() === OWNER_NAME;
  }

  function ownerTag(size) {
    return (
      '<span class="owner-badge' +
      (size === "lg" ? " lg" : "") +
      '" title="站长" aria-label="站长">' +
      '<span class="crown" aria-hidden="true">♛</span>站长</span>'
    );
  }

  /* 名字 + 站长徽章；名字会转义，普通用户不受影响 */
  function displayName(name, size) {
    return escapeHtml(name) + (isOwner(name) ? ownerTag(size) : "");
  }

  return {
    OWNER_NAME: OWNER_NAME,
    isOwner: isOwner,
    ownerTag: ownerTag,
    displayName: displayName,
    USERS_KEY: USERS_KEY,
    PUBLIC_KEY: PUBLIC_KEY,
    SESSION_KEY: SESSION_KEY,
    DEVICE_KEY: DEVICE_KEY,
    ok: ok,
    hashPass: hashPass,
    encryptList: encryptList,
    decryptList: decryptList,
    randomHex: randomHex,
    read: read,
    write: write,
    deviceId: deviceId,
    nowStr: nowStr,
    localUsers: localUsers,
    publicEntries: publicEntries,
    session: session,
    saveSession: saveSession,
    logout: logout,
    toPublic: toPublic,
    download: download,
  };
})();
