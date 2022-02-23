function initCanvas() {
    let victor = new Victor("header", "canvas");
    let theme = ["#18bbff", "#00486b"]
    victor(theme).set()
}

function titleBtn() {
    let rotating = false
    const mainBody = document.querySelector('#mainBody')
        , switchBtn = document.querySelector('#switch')
    let outForm = document.querySelector('#loginForm')
        , inForm = document.querySelector('#registerForm')
    document.querySelector('#switch').onclick = () => {
        if (!rotating) {
            rotating = true
            mainBody.style.animationName = "rotateOut"
            setTimeout(() => {
                outForm.style.display = 'none'
                inForm.style.display = 'block'
                mainBody.style.animationName = "rotateIn"
                let tmpForm = outForm
                outForm = inForm
                inForm = tmpForm
                switchBtn.title = switchBtn.title === '注册账号' ? '返回登录' : '注册账号'
                setTimeout(() => {
                    rotating = false
                }, 250)
            }, 250)
        }
    }
}

function titleBtnIpc(electron) {
    document.querySelector('#shutdown').onclick = () => {
        electron.ipcRenderer.send('quit')
    }
    document.querySelector('#minimize').onclick = () => {
        electron.ipcRenderer.send('minimize')
    }
}

function loginBtn(electron) {
    document.querySelector('#loginBtn').onclick = () => {
        electron.ipcRenderer.send('login', document.querySelector('#loginForm #userid').value)
    }
}

function buttonRipple() {
    const duration = 750;

    // 样式string拼凑
    let forStyle = (position) => {
        let cssStr = '';
        for (let key in position) {
            if (position.hasOwnProperty(key)) cssStr += key + ':' + position[key] + ';';
        };
        return cssStr;
    }

    // 获取鼠标点击位置
    let forRect = (target) => {
        let position = {
            top: 0,
            left: 0
        }
        'undefined' !== typeof target.getBoundingClientRect && (position = target.getBoundingClientRect());
        /**
         * 也可以写成以下形式
         * if (typeof target.getBoundingClientRect !== 'undefined') {
         *    position = target.getBoundingClientRect();
         * }
         */
        return {
            top: position.top + window.pageYOffset - document.documentElement.clientTop,
            left: position.left + window.pageXOffset - document.documentElement.clientLeft
        }
    }

    let show = (event) => {
        let pDiv = event.target,
            cDiv = document.createElement('div');
        pDiv.appendChild(cDiv);
        let rectObj = forRect(pDiv),
            _height = event.pageY - rectObj.top,
            _left = event.pageX - rectObj.left,
            _scale = 'scale(' + pDiv.clientWidth / 100 * 10 + ')';
        let position = {
            top: _height + 'px',
            left: _left + 'px'
        };
        cDiv.className = cDiv.className + " waves-animation",
            cDiv.setAttribute("style", forStyle(position)),
            position["-webkit-transform"] = _scale,
            position["-moz-transform"] = _scale,
            position["-ms-transform"] = _scale,
            position["-o-transform"] = _scale,
            position.transform = _scale,
            position.opacity = "1",
            position["-webkit-transition-duration"] = duration + "ms",
            position["-moz-transition-duration"] = duration + "ms",
            position["-o-transition-duration"] = duration + "ms",
            position["transition-duration"] = duration + "ms",
            position["-webkit-transition-timing-function"] = "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            position["-moz-transition-timing-function"] = "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            position["-o-transition-timing-function"] = "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            position["transition-timing-function"] = "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            cDiv.setAttribute("style", forStyle(position));
        let finishStyle = {
            opacity: 0,
            "-webkit-transition-duration": duration + "ms",
            "-moz-transition-duration": duration + "ms",
            "-o-transition-duration": duration + "ms",
            "transition-duration": duration + "ms",
            "-webkit-transform": _scale,
            "-moz-transform": _scale,
            "-ms-transform": _scale,
            "-o-transform": _scale,
            top: _height + "px",
            left: _left + "px",
        };
        setTimeout(function () {
            cDiv.setAttribute("style", forStyle(finishStyle));
            setTimeout(function () {
                pDiv.removeChild(cDiv);
            }, duration);
        }, 100)
    }
    document.querySelectorAll('.submit').forEach(element => {
        element.addEventListener('click', function (e) {
            show(e);
        }, !1);
    });
}

(function () {
    initCanvas()
    buttonRipple()
    titleBtn()
    const electron = window.require('electron');
    titleBtnIpc(electron)
    loginBtn(electron)
})()