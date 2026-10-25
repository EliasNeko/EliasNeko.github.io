/* 这里是我这台店的“总开关”。
   平时用 Supabase，不用开电脑；想用自己电脑上的 Java 服务，就把云端两项留空。
   如果哪天 supabase.co 又被网络重置，只改下面的 SUPABASE_PROXY 就行，
   其他页面不用跟着动。 */

window.SUPABASE_URL = "https://wjvwupcquwjoajdvinkx.supabase.co";
window.SUPABASE_KEY = "sb_publishable_Wy3IyDHb-0yFAuRHbxuLFw_obIXU3OI";

/* 如果 supabase.co 在某些网络被重置，可以在这里填反向代理地址（结尾不带斜杠）。
   代理要转发 /rest/v1/* 到上面的 SUPABASE_URL；留空就直连。 */
window.SUPABASE_PROXY = "https://coffee-cloud.pages.dev";

window.COFFEE_API = "";
