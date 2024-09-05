// ==UserScript==
// @name         v2ex AI 回答问题
// @namespace    https://github.com/falconchen/scripts
// @version      0.1.1
// @description  实现 AI 回答 v2ex 帖子中的问题，可使用 deepseek 或其他与openai api对齐的LLM，会保留缓存记录到本地避免大量消耗 token。从 https://github.com/dlzmoe/scripts的v2ex AI 总结帖子脚本 修改而来
// @author       falconchen
// @match        *://v2ex.com/*
// @match        *://*.v2ex.com/*
// @match        *://www.v2ex.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @grant        GM_info
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAACoAIABAAAAAEAAAAgoAMABAAAAAEAAAAgAAAAAI9OQMkAAARKSURBVHicrVe7SzNLFP/t7CObbEg0WliJooUxcAsfYKFW2lh8NhdLwUIsbMTCBG3EIoid4J/xNd9t7ZSAIiJcNaSIYBcbNVlMsq/M3MK762YziVE8EGbYOTnnd55zRsD/xBiT7+/vf+u6vlir1VTLskApFfADRAhhiqIgEokYsVjsNJVK/S0Igg0AAgAUCoW/np+fr15fX5WfUPgZ9fT0WP39/dNjY2P/SowxOZfLXZXLZUVRFIyPjyORSCAUCkEQmh3AGIMgCGCMAYC3D/IFiVIKy7Lw8vKCfD6PcrmsALhijEWFu7u7P4+Pj78URcHMzAyi0WjXCoPnQeLxV6tVXFxcwLIsDA0N/UN0XV8EgGQyCU3TQClFo9FAo9EAY8xb/Xv33OWllIJSCsaYt/L4GWPQNA3JZBIAoOv6olSr1VQASCQS3h/9FgWtC54FPcDbB2UkEgkAQK1WUyXLsgAAiqK0MFNKIQgCKKVcl3ajMChPFEXIsgwAsCwLkltq/jh1K/C7RAhxAQmSX3DQwo2NDZydnbWcu4D9vKFQCNvb21hdXfUU8ZIwaIQHwD3w50Aul/PQflZyjuPg6OgIoVAIKysrbRUGc6wFgH8lhLRV2K4Es9ksotEolpaWuuobTSEAPhIPACSpCV/XtL+/D03TMD8/3ySP5xHiB+BnYIxBFEUQQkAI8faiKHJ/fh7GGPb29nB9fd0kryOAIBAXgCRJkCQJhBBv5QGSJKmJ33EcpNNp5PP5JpnBkHXMgcvLy65cXiqVsLm5iaenp6bvpmkinU7j+PgYw8PD3BJuCgEAr+kEAXXqCQMDAzg5OUFfX19LaN7e3pDJZGDbNtcLXA+4ICzL6nj5uHu3WtwwBIn3rQVAJws/6/WlUgmZTAa6rnvKXHDxeByHh4cghHgXFRcAT8Hy8nLXVy/P0nA4jGw2i8HBQTiO09kDfgD+PvDdWUCWZRwcHGB0dBTuhcczkhsCfyfslvwACSHY3d1FKpXy8oinvAlAEATw7tLPEjB4DgBbW1uYnJyEYRhfb8V+hJ0AtPPA+vo6ZmdnYZpmizy3urruhFNTU17n83dDf9dz6z0cDmNtbQ0LCwswDKNpNON1QK4Hgi7a2dnh/qkdMcZgmmbbCYo7DxBCGKVU4CWh/ybjCQwqNwyD2zWDSdhoNAC8P1gkWZZhmiYsy4KiKCCEeAz1ev1LpfdZqYqiCMaY1xNkWQZRVdUAgHK5/PHxY2bzVv/eb43fa/7RPMhPCPGGUVeXqqqGFI1GTyuVyq9isQhN0xCJRBAKhbqy8KvE2PvDpFgsAgA0TTsVGGPy+fn5m67riizLGBkZQTweh6Io31YUJEopbNtGpVLBw8MDbNtGLBaz5ubmopIgCPbt7e00gCtd15VCofAjSjtRLBazent7pwVBsD0TGWPyzc3N72q1uliv11XHcX70eS7LMlRVNSKRyOnExIT3PP8P91unlxYYZf4AAAAASUVORK5CYII=
// @license      Apache-2.0 license
// @downloadURL https://update.greasyfork.org/scripts/506898/v2ex%20AI%20%E5%9B%9E%E7%AD%94%E9%97%AE%E9%A2%98.user.js
// @updateURL https://update.greasyfork.org/scripts/506898/v2ex%20AI%20%E5%9B%9E%E7%AD%94%E9%97%AE%E9%A2%98.meta.js
// ==/UserScript==

(function () {
  'use strict';
  var menu_ALL = [
    ['menu_ManualAnswer', '是否开启手动回答 / 自动', '是否开启手动回答 / 自动', true],
  ];
  var menu_ID = [];
  for (let i = 0; i < menu_ALL.length; i++) { // 如果读取到的值为 null 就写入默认值
    if (GM_getValue(menu_ALL[i][0]) == null) {
      GM_setValue(menu_ALL[i][0], menu_ALL[i][3])
    };
  }
  registerMenuCommand();

  // 注册脚本菜单
  function registerMenuCommand() {
    if (menu_ID.length > menu_ALL.length) { // 如果菜单ID数组多于菜单数组，说明不是首次添加菜单，需要卸载所有脚本菜单
      for (let i = 0; i < menu_ID.length; i++) {
        GM_unregisterMenuCommand(menu_ID[i]);
      }
    }
    for (let i = 0; i < menu_ALL.length; i++) { // 循环注册脚本菜单
      menu_ALL[i][3] = GM_getValue(menu_ALL[i][0]);
      menu_ID[i] = GM_registerMenuCommand(`${menu_ALL[i][3]?'✅':'❌'} ${menu_ALL[i][1]}`, function () {
        menu_switch(`${menu_ALL[i][3]}`, `${menu_ALL[i][0]}`, `${menu_ALL[i][2]}`)
      });
    }
    menu_ID[menu_ID.length] = GM_registerMenuCommand('⚙️ 设置API key配置', function () {
      setApiConfig();
    });

    menu_ID[menu_ID.length] = GM_registerMenuCommand('💬 建议与反馈！', function () {
      window.GM_openInTab("https://github.com/falconchen/scripts", {
        active: true,
        insert: true,
        setParent: true
      });
    });

  }

  function setApiConfig(callback) {
    $('body').append(`
      <div class="v2exaianswer">
  <input type="text" id="v2exaianswer-apikey" placeholder="sk-xxxxxxx">
  <input type="text" id="v2exaianswer-baseurl" placeholder="https://api.openai.com" value="https://api.openai.com">
  <input type="text" id="v2exaianswer-model" placeholder="gpt-4o-mini" value="gpt-4o-mini">
  <button id="v2exaianswer-save">保存</button>
</div>
      `)

    $('.v2exaianswer').show();

    var v2exaianswerAPI = JSON.parse(localStorage.getItem('v2exaianswerAPI')) || {
      apikey: "",
      baseurl: "",
      model: "",
    };

    $('#v2exaianswer-apikey').val(v2exaianswerAPI.apikey);
    $('#v2exaianswer-baseurl').val(v2exaianswerAPI.baseurl);
    $('#v2exaianswer-model').val(v2exaianswerAPI.model);

    // 保存
    $('#v2exaianswer-save').click(function () {
      v2exaianswerAPI = {
        apikey: $('#v2exaianswer-apikey').val(),
        baseurl: $('#v2exaianswer-baseurl').val(),
        model: $('#v2exaianswer-model').val(),
      }
      localStorage.setItem('v2exaianswerAPI', JSON.stringify(v2exaianswerAPI));
      $('.v2exaianswer').remove();
      if (callback) callback();
    })
  }

  // 菜单开关
  function menu_switch(menu_status, Name, Tips) {
    if (menu_status == 'true') {
      GM_setValue(`${Name}`, false);
      GM_notification({
        text: `已关闭 [${Tips}] 功能\n（点击刷新网页后生效）`,
        timeout: 3500,
        onclick: function () {
          location.reload();
        }
      });
    } else {
      GM_setValue(`${Name}`, true);
      GM_notification({
        text: `已开启 [${Tips}] 功能\n（点击刷新网页后生效）`,
        timeout: 3500,
        onclick: function () {
          location.reload();
        }
      });
    }
    registerMenuCommand(); // 重新注册脚本菜单
  };

  // 返回菜单值
  function menu_value(menuName) {
    for (let menu of menu_ALL) {
      if (menu[0] == menuName) {
        return menu[3]
      }
    }
  }
  $(function () {

  })
  // 手动回答
  function menu_ManualAnswer() {
    isCache();
    if (menu_value('menu_ManualAnswer')) {
      // 手动回答
      $('.aianswer').click(function () {
        $('.aianswer').hide();
        getPostContent();
      })
    } else {
      // 自动回答
      $('.aianswer').hide();
      getPostContent();
    }
  }

  if (window.location.pathname.indexOf('/t/') > -1) {
    menu_ManualAnswer();
  }

  // 获取帖子内容
  function getPostContent() {
    var v2exaianswerAPI = JSON.parse(localStorage.getItem('v2exaianswerAPI'));
    
    // 检查是否已配置API信息
    if (!v2exaianswerAPI || !v2exaianswerAPI.apikey || !v2exaianswerAPI.baseurl || !v2exaianswerAPI.model) {
      // 如果未配置,弹出设置窗口
      setApiConfig(getPostContent);
      return;
    }
    
    $('.gpt-answer-wrap').show();
    return new Promise((resolve, reject) => {
      const topic_title = $('h1').html();
      const topic_content = $('div.topic_content').html();

      const v2exprompt = `你是一位智能AI助手。请仔细阅读以下由三重引号分隔的文本,其中包含一个问题或讨论主题。你的任务是:

1. 识别文本中的主要问题或讨论点
2. 提供一个全面、有见地且有帮助的回答
3. 如果有多个问题,请逐一回答
4. 如果问题不明确,请尝试理解潜在的意图并给出最佳回答
5. 回答应该详细、准确,并尽可能提供有用的信息或建议

请用简体中文回答。不要重复问题,直接给出回答。

"""
标题: ${topic_title}
内容: ${topic_content}
"""
`;

      fetch(`${v2exaianswerAPI.baseurl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${v2exaianswerAPI.apikey}`,
          },
          body: JSON.stringify({
            model: v2exaianswerAPI.model,
            messages: [{
              role: "user",
              content: v2exprompt,
            }],
            temperature: 0.7,
          }),
        })
        .then(response => {
          if (!response.ok) {
            reject(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(gptData => {
          $(".gpt-answer").html(`AI 回答：<br>${gptData.choices[0].message.content.replace(/\n/g, '<br>')}`);
          $('.airegenerate').show();

          let v2exaianswerdata =
            JSON.parse(localStorage.getItem("v2exaianswerdata")) || [];
          const match = window.location.pathname;
          let existingObject = v2exaianswerdata.find((item) => item.name == match);

          let newObject = {
            name: match,
            value: gptData.choices[0].message.content,
          };
          if (existingObject) {
            existingObject.value = newObject.value;
          } else {
            v2exaianswerdata.push(newObject);
          }
          // 将帖子回答的数据缓存
          localStorage.setItem("v2exaianswerdata", JSON.stringify(v2exaianswerdata));
          resolve();

        })
        .catch(error => {
          $(".gpt-answer").html(`抱歉生成失败，请检查配置或者反馈给开发者！`);
          $('.airegenerate').show();
        });
    });
  }

  // 先判断是否有缓存
  function isCache() {
    $("#Main .box>.header").after(`<button type="button" class="aianswer">AI回答</button>`);
    $("#Main .box>.header").after(
      `<div class="gpt-answer-wrap">
       <div class="gpt-answer">AI 回答：正在使用 AI 生成回答中，请稍后...</div>
       <button type="button" class="airegenerate" style="display:none">重新生成</button>
        </div>`
    );

    let v2exaianswerdata = JSON.parse(localStorage.getItem("v2exaianswerdata")) || [];
    const match = window.location.pathname;
    let existingObject = v2exaianswerdata.find((item) => item.name === match);

    if (existingObject) {
      // 存在缓存，拿旧数据
      $('.gpt-answer-wrap').show();
      $(".gpt-answer").html(`AI 回答：<br>${existingObject.value.replace(/\n/g, '<br>')}`);
      $('.airegenerate').show();
      $('.aianswer').hide();

    } else {
      $('.gpt-answer-wrap').hide();

      if (!menu_value('menu_ManualAnswer')) {
        getPostContent();
      }
    }

    $('.airegenerate').click(() => {
      $('.gpt-answer').html(`AI 回答：正在使用 AI 生成回答中，请稍后...`)
      $('.airegenerate').hide();
      getPostContent();
    })
  }

  $('body').append(`<style>.gpt-answer-wrap{background:#fffbd9;border-radius:5px;padding:10px;font-size:14px;color:#303030;margin:0;line-height:1.6;text-align:left}.aianswer{display:flex;outline:0;border:1px solid #eee;background:#ffe27d;color:#626262;padding:4px 10px;cursor:pointer;border-radius:3px}.gpt-answer-wrap .airegenerate{margin-top:6px;outline:0;border:1px solid #eee;background:#ffe27d;color:#626262;padding:4px 10px;cursor:pointer;border-radius:3px}.v2exaianswer{position:fixed;bottom:20px;right:20px;z-index:99999;max-width:400px;padding:20px;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);background-color:#f9f9f9;display:none}.v2exaianswer input[type=text]{width:100%;padding:10px;margin:10px 0;border:1px solid #ccc;border-radius:4px;font-size:16px;transition:border-color .3s}.v2exaianswer input[type=text]:focus{border-color:#007bff;outline:0}.v2exaianswer button{width:100%;padding:10px;background-color:#007bff;color:#fff;border:none;border-radius:4px;font-size:16px;cursor:pointer;transition:background-color .3s}.v2exaianswer button:hover{background-color:#0056b3}.gpt-answer {
    white-space: pre-line;
  }</style>`)
})();