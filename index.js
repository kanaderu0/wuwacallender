document.addEventListener('DOMContentLoaded', () => {
    async function createiframe(){
        const content = document.getElementById("content");
        const iframe = document.createElement("iframe");
        const res = await fetch('https://wuwacallender.vercel.app/api/getVideo');
        const data = await res.json();
        const videoId = await data.url;
        
        iframe.id = "bg-iframe";
        iframe.src = `https://www.youtube.com/embed/${videoId}?modestbranding=1&playlist=${videoId}&loop=1&enablejsapi=1&rel=0&controls=0`;
        iframe.allow = "autoplay; encrypted-media; fullscreen";
        iframe.frameBorder = 0;

        content.parentNode.insertBefore(iframe, content);

        iframe.addEventListener('load', () => {
            let ytStatus = "stop";
            const video = document.getElementById('video');
            const iframe = document.getElementById('bg-iframe');

            // ユーザー操作後に再生
            document.addEventListener('click', () => {
                console.log(ytStatus);
                if(ytStatus === "stop"){
                ytStatus = "play";
                iframe.contentWindow.postMessage(
                    JSON.stringify({
                        event: "command",
                        func: "playVideo",
                        args: []
                    }),
                    "*"
                );
                }else{
                ytStatus = "stop";
                iframe.contentWindow.postMessage(
                JSON.stringify({
                    event: "command",
                    func: "pauseVideo",
                    args: []
                }),
                "*"
                )
                };
                // video.muted = false; // 音声ON
                // video.volume = 1;
                // video.play();
            });
        });
    }

    createiframe();

    //高さ計算
    function setVh(){
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`); 
    }
    setVh();
    window.addEventListener('resize', setVh);

    //カレンダー生成
    const date = new Date();
    const year = date.getFullYear();
    const today = date.getDate();
    const currentMonth = date.getMonth() + 1;
    let nowMon = currentMonth - 1;

    document.getElementById('nowyear').textContent = year + "年";

    function createCalendar(month) {
        const monthDays = ["日", "月", "火", "水", "木", "金", "土"];
        let calendarHTML;
        if(currentMonth === month){
            calendarHTML = `
            <h2 id="nowMonth"><span class='month'>${month}</span>月</h2>
            <table class="calendar"><tr>
            `;
        }else{
            calendarHTML = `
            <h2><span class='month'>${month}</span>月</h2>
            <table class="calendar"><tr>
            `;
        }
        for (let i = 0; i < 7; i++) {
            if (i === 0) {
                calendarHTML += `<th class="sun">${monthDays[i]}</th>`;
            } else if (i === 6) {
                calendarHTML += `<th class="sat">${monthDays[i]}</th>`;
            } else {
                calendarHTML += `<th>${monthDays[i]}</th>`;
            }
        }

        calendarHTML += '</tr><tbody>';

        const daysInMonth = new Date(date.getFullYear(), month, 0).getDate();
        const firstDay = new Date(date.getFullYear(), month, 1).getDay();
        let dayCount = 1;
        let prevDayCount = daysInMonth - firstDay + 1;

        for (let i = 0; i < 5; i++) {
            calendarHTML += '<tr>';

            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    calendarHTML += `<td class="mute">${prevDayCount}</td>`;
                    prevDayCount++;
                } else if (dayCount > daysInMonth) {
                    let nextMonthDayCount = dayCount - daysInMonth;
                    calendarHTML += `<td class="mute">${nextMonthDayCount}</td>`;
                    dayCount++;
                } else {
                    // 今日の日付にclassを付ける
                    if (dayCount === today && month === currentMonth) {
                        calendarHTML += `<td id="today">${dayCount}</td>`;
                    } 
                    // 月曜日にclassを付ける
                    else if (j === 1) {
                        calendarHTML += `<td class="off">${dayCount}</td>`;
                    }else if (i==1 && j==4){
                        calendarHTML += `<td class="center">${dayCount}</td>`;
                    }else {
                        calendarHTML += `<td>${dayCount}</td>`;
                    }
                    dayCount++;
                }
            }

            calendarHTML += '</tr>';

            if (dayCount - daysInMonth > 7) {
                break;
            }
        }

        calendarHTML += '</tbody></table>';

        return calendarHTML;
    }
    for(let i=1; i<13; i++){
        document.getElementById('calendar').innerHTML += createCalendar(i);
        if(i == 12){
        const elements = document.querySelectorAll(".center");

        elements[nowMon].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        }
    }

    //スクロールイベントを管理
    let isScrolling = false;

    //PC用（マウスホイール）
    window.addEventListener('wheel', function(e) {
        e.preventDefault(); // デフォルトのスクロールを無効化

        if (isScrolling) return; // 連続スクロール防止
        isScrolling = true;

        const direction = e.deltaY > 0 ? 1 : -1;
        scrollPage(direction);
    }, { passive: false });

    //スマホ用（タッチスワイプ）
    let touchStartY = 0;
    let touchEndY = 0;

    window.addEventListener('touchmove', function(e) {
        // デフォルトのスクロールを無効化
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;

        // スワイプ距離が1px以上ならスクロール
        if (Math.abs(deltaY) > 1 && !isScrolling) {
        isScrolling = true;
        const direction = deltaY > 0 ? 1 : -1;
        scrollPage(direction);
        }
    }, { passive: false });

    window.addEventListener("keydown", function(e) {
    if (event.key === "ArrowUp") {
        e.preventDefault(); // デフォルトのスクロールを無効化
        const direction = -1;
        scrollPage(direction);
    }
    if (event.key === "ArrowDown") {
        e.preventDefault();
        const direction = 1;
        scrollPage(direction);
    }
    }, { passive: false });
    
    //共通スクロール処理
    function scrollPage(direction){
        const elements = document.querySelectorAll(".center");
        if(nowMon > 0 && nowMon < 11 || nowMon == 0 && direction == 1 || nowMon == 11 && direction == -1){
        nowMon = nowMon + direction;
        }

        console.log(nowMon);
        console.log(direction);

        elements[nowMon].scrollIntoView({
        behavior: "smooth",
        block: "center"
        });

        // アニメーションが終わるまで待機
        setTimeout(() => { isScrolling = false; }, 100);
    }
});
