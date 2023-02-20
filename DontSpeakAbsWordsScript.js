// ==UserScript==
// @name         DontSpeakAbsWords
// @namespace    https://github.com/IgarashiAkatuki/DontSpeakAbsWords
// @version      0.2.1
// @description  This is a test version
// @author       Midsummra
// @match        https://*/*
// @icon         https://project.midsummra.com/favicon.ico
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.3/jquery.js
// ==/UserScript==
(function () {
    $('head').append($(`
    <style>
      #transPopover{
        position: absolute;
        width: 320px;
        height: 170px;
        z-index: 1;
        background-color:rgba(211,211,211,0.6);
        border-radius: 10px;
        backdrop-filter: blur(5px);
        margin-top: 20px;
      }

      #trans{
        margin: 0 auto;
        margin-top: 15px;
      }
      .transList{
        list-style: none;
        margin-right: 15px;
        margin-left: 5px;
        margin-top: 20px;
        text-align: left;
        word-wrap:break-word;
        word-break:break-all;
        overflow: hidden;
        display：inline-block;
        display: inline;
        line-height: 20px;
        float:left
        font-size: 20px;
      }
      .submitTrans{
        position: absolute;
        bottom: 0;
        list-style: none;
        margin-left: 20px;
        text-align: left;
        word-wrap:break-word;
        word-break:break-all;
        overflow: hidden;
        display：inline-block;
        font-style:italic;
      }
      
      #transPrompt{
      margin-left: 20px;
      margin-top: 50px;
      }
    </style>
    `))
    let data = {
        select: '',
        posX: 0,
        posY: 0
    }

    $(document).mousedown(function(e){
        let _dom = $('#transPopover');
        if(!_dom.is(e.target) && _dom.has(e.target).length === 0){
            $('#trans').hide();
            $('#transPrompt').hide();
            $('.submitTrans').hide();
            _dom.hide();
            window.getSelection().removeAllRanges()
            data.select = ''
        }
    });


    $(document).keyup(function (e) {
        if (e.keyCode === 191){
            createPopover(e)
        }
    })

    $(document).mouseup(function (e) {
        getSelection(e)
    })

    function getSelection(e) {
        let _dom = $('#transPopover')
        if (_dom.length <= 0){
            $('body').append(`<div id="transPopover"></div>`)
            $('#transPopover').hide()
        }

        if(_dom.has(e.target).length !== 0){
            return;
        }

        const select = document.getSelection().toString()
        if (select.trim() !== '' && select.length <= 10 && select.indexOf('\n') === -1) {
            let posX = 0
            let posY = 0
            let event = window.event;
            if (event.pageX || event.pageY) {
                posX = event.pageX
                posY = event.pageY
            } else if (event.clientX || event.clientY) {
                posX = event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft
                posY = event.clientY + document.documentElement.scrollTop + document.body.scrollTop
            }

            data.select = select
            data.posX = posX
            data.posY = posY
        }
    }


    function createPopover() {
        if (data.select.trim() !== '' && data.select.length <= 10 && data.select.indexOf('\n') === -1) {

            let isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1;
            if (isChrome) {
                $('#transPopover').css('left', data.posX + "px")
                $('#transPopover').css('top', (data.posY + 15) + "px")
            } else {
                $('#transPopover').css('pixelLeft', data.posX)
                $('#transPopover').css('pixelTop', data.posY + 15)
            }
            $('#transPopover').show()
            getTrans(data.select)

        }
    }

    function createDiv(content) {
        let list = '<ul id="trans"></ul>'
        let trans = []
        let temp = '<span id="transPrompt">可能的释义:</span>'
        let submit = '<span class="submitTrans" style="color: skyblue; margin-bottom: 20px">没有查找到想要的释义？点我添加</span>'
        if (content === null){
                trans.push(`
                <li class="transList">
                <span class="submitTrans" style="color: skyblue; margin-bottom: 20px">未查询到相关释义，点击提交</span>
                </li>
                `)
            submit = ''
        }else if (Array.isArray(content)) {
            for (let i = 0; i < content.length; i++) {
                trans.push('<li class="transList" style="margin-top: 20px;">' + content[i].translation + '</li>')
            }
        } else if (content === 0) {
            trans.push('<li class="transList">' + '连接超时,请稍后重试' + '</li>')
        } else {
            trans.push('<li class="transList">' + '发生未知错误' + '</li>')
        }

        let dom = $('#transPopover')
        if (dom.length > 0) {
            dom.css('display', 'block')

            dom.empty().append(temp).append(list).append(submit)
            $('#trans').append(trans)
            dom.show(200);
            $('#trans').show()
        } else {
            $('body').append(`<div id="transPopover"></div>`)
            $('#transPopover').append(list)
            $('#trans').append(trans)
        }
    }

    function getTrans(word) {
        let trans = ''
        $.ajax({
            url: 'https://project.midsummra.com/api/getTranslationsFromPersistence',
            type: 'POST',
            dataType: 'JSON',
            timeout: 3000,
            data: {
                word: word
            },
            success(resp) {
                trans = resp.data
            },

            complete(XMLHttpRequest, textStatus) {
                if (textStatus === 'timeout') {
                    trans = 0;
                }
                createDiv(trans)
            },

            error() {
                trans = -1;
            }
        })
    }


    $(document).on('click','.submitTrans',function () {
        const trans = prompt('请输入['+data.select+']的释义:')
        if (trans !== '' && (trans.length > 0 && trans.length <= 30)){
            let res;
            $.ajax({
                url: 'https://project.midsummra.com/api/submitTranslationsToTemp',
                dataType: 'JSON',
                type: 'POST',
                timeout: 3000,
                data: {
                    word: data.select,
                    translation: trans
                },
                success(resp) {
                    res = resp.code
                },
                error() {
                    res = '请求失败，请稍后重试QAQ'
                },
                complete(textStatus) {
                    if (textStatus === 'timeout'){
                        alert('请求超时，请稍后重试QAQ')
                    }else {
                        if (res === 0){
                            alert('提交成功，感谢您的提交=w=')
                        }else if (!Number.isNaN(res)){
                            alert('请求失败QAQ，请稍后重试')
                        }else {
                            alert(res)
                        }
                    }
                }
            })
        }
    })
})()