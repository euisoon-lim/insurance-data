
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const sumItemIndex = jsonData.findIndex(item => item["담보명"] === "합계");
    if (sumItemIndex > -1) {
      const sumItem = jsonData.splice(sumItemIndex, 1)[0];
      jsonData.unshift(sumItem);
    }

    // ▼ 상단 메뉴 셀렉트 박스 요소 가져오기
    const productSelect = document.getElementById('productSelect');
    const genderSelect = document.getElementById('genderSelect');

    // ▼ .widget 내의 메뉴 항목 수집 (ul > li)
    const menuItems = document.querySelectorAll('.widget .sub-menu > ul > li');
    const menuData = [];

    // ▼ 각 상품군과 그 하위 메뉴를 추출하여 menuData 배열로 정리
    menuItems.forEach(parentItem => {
        const parentText = parentItem.querySelector('a')?.innerText.trim();
        const subItems = parentItem.querySelectorAll('ul li a');

        const subs = [];
        subItems.forEach(sub => {
            subs.push({
                text: sub.innerText.trim(),
                href: sub.getAttribute('href')
            });
        });

        if (parentText) {
            menuData.push({ title: parentText, subs });

            // 상품 셀렉트박스에 옵션 추가
            const option = document.createElement('option');
            option.text = parentText;
            option.value = menuData.length - 1;
            productSelect.appendChild(option);
        }
    });

    // ▼ 상품 선택 시, 해당 성별 옵션 보여주기
    productSelect.addEventListener('change', () => {
        const selectedIndex = productSelect.value;
        const selectedMenu = menuData[selectedIndex];

        genderSelect.innerHTML = '<option disabled selected>성별을 선택하세요</option>';
        genderSelect.disabled = false;

        selectedMenu.subs.forEach(sub => {
            if (sub.text === selectedMenu.title) return;
            const option = document.createElement('option');
            option.text = sub.text;
            option.value = sub.href;
            genderSelect.appendChild(option);
        });
    });

    // ▼ 성별 선택 시 → 해당 URL로 이동
    genderSelect.addEventListener('change', () => {
        const url = genderSelect.value;
        if (url) location.href = url;
    });

    // ▼ 현재 URL에 따라 상품/성별 자동 선택
    function setCurrentSelectionByURL() {
        const currentURL = window.location.pathname;

        menuData.forEach((menu, index) => {
            const match = menu.subs.find(sub => currentURL.includes(sub.href));
            if (match) {
                productSelect.value = index;
                genderSelect.innerHTML = '<option disabled selected>성별을 선택하세요</option>';
                genderSelect.disabled = false;

                menu.subs.forEach(sub => {
                    if (sub.text === menu.title) return;
                    const option = document.createElement('option');
                    option.text = sub.text;
                    option.value = sub.href;
                    if (currentURL.includes(sub.href)) option.selected = true;
                    genderSelect.appendChild(option);
                });
            }
        });
    }

    // ▼ URL 기준으로 자동 설정 실행
    setCurrentSelectionByURL();

    // ▼ 검색창에서 필터링 처리
    function filterJsonData() {
        const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
        filteredData = jsonData.filter(item => item["담보명"].toLowerCase().includes(keyword));
        renderList(filteredData);
    }

    // ▼ PC용 리스트 내에서도 필터링(백업용 함수)
    function filterList() {
        const keyword = document.getElementById('searchInputPC').value.toLowerCase();
        filteredData = jsonData.filter(item => item["담보명"].toLowerCase().includes(keyword));
        renderList(filteredData);
    }

    // ▼ Chart 객체 전역 저장
    let chart;
    let filteredData = [...jsonData];

    // ▼ 좌측 리스트 렌더링
    function renderList(data = jsonData) {
        const listDiv = document.getElementById("list");
        listDiv.innerHTML = '';

        data.forEach((item, index) => {
            const amountText = item["가입금액"].includes("만원") ? item["가입금액"] : item["가입금액"] + "만원";

            const itemDiv = document.createElement("div");
            itemDiv.className = "item-box";
            itemDiv.setAttribute("data-index", index);
            itemDiv.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${item["담보명"]}</div>
                    <div style="color:rgb(108, 108, 108); font-size:12px;">${amountText}</div>
                </div>
            `;

            itemDiv.onclick = () => {
                document.querySelectorAll('.item-box').forEach(el => el.classList.remove('selected'));
                itemDiv.classList.add('selected');
                renderChart(item);
            };

            listDiv.appendChild(itemDiv);
            setTimeout(() => itemDiv.classList.add("show"), index * 100);
        });

        renderMobileSelect(data);

        if (data.length > 0 && window.innerWidth > 768) {
            const firstItem = listDiv.querySelector('.item-box');
            firstItem.classList.add('selected');
            renderChart(data[0]);
        }

        if (data.length > 0 && window.innerWidth <= 768) {
            const select = document.getElementById('mobile-select');
            select.value = data[0]["담보명"];
            const selectedItem = data[0];
            if (selectedItem) renderChart(selectedItem);
        }
    }

    // ▼ 모바일용 셀렉트 드롭다운 생성
    function renderMobileSelect(data) {
        const select = document.getElementById("mobile-select");
        select.innerHTML = '';
        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item["담보명"];
            option.textContent = `${item["담보명"]} (${item["가입금액"]})`;
            select.appendChild(option);
        });
    }

    // ▼ 모바일 셀렉트 선택 시 그래프 반영
    function handleSelectChange(select) {
        const selectedItem = filteredData.find(item => item["담보명"] === select.value);
        if (selectedItem) renderChart(selectedItem);
    }

    // ▼ 그래프 그리기 (Chart.js)
    function renderChart(item) {
        const ctx = document.getElementById("chart").getContext("2d");
        const entries = Object.entries(item).filter(([key]) => !["담보명", "가입금액"].includes(key));
        const labels = entries.map(([key]) => key);
        const data = entries.map(([_, value]) => value);
        const minValue = Math.min(...data.filter(v => v > 0));

        const backgroundColors = data.map(v => {
            const g = ctx.createLinearGradient(0, 0, 0, 300);
            if (v === minValue) {
                g.addColorStop(0, '#FF3B30'); g.addColorStop(1, '#FF6B61');
            } else {
                g.addColorStop(0, '#2C5FFF'); g.addColorStop(1, '#6CA8FF');
            }
            return g;
        });

        document.getElementById("chart-title").textContent = `${item["담보명"]} 보험료 비교`;

        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{ data, backgroundColor: backgroundColors, borderWidth: 1 }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#333' }, grid: { color: '#eee' } },
                    x: { ticks: { color: '#333' }, grid: { color: '#eee' } }
                }
            }
        });

        if (window.innerWidth <= 768) {
            chart.options.scales.y.ticks.font = { size: 12 };
            chart.update();
        }

        renderPriceTable(labels, data, minValue);
    }

    // ▼ 표 렌더링 (가격 테이블)
    function renderPriceTable(labels, data, minValue) {
        const tableDiv = document.getElementById("price-table");
        let html = `<table><tr><th>보험사</th><th>상품명</th><th>보험료</th></tr>`;
        labels.forEach((label, i) => {
            const value = data[i];
            const highlight = value === minValue ? ' style="color:red; font-weight:bold;"' : '';
            html += `<tr>
                <td${highlight}>${label}</td>
                <td${highlight}>${productData[label] || '-'}</td>
                <td${highlight}>${value.toLocaleString()}원</td>
            </tr>`;
        });
        html += `</table>`;
        tableDiv.innerHTML = html;
    }

    // ▼ 첫 실행 시 전체 리스트 렌더링
    renderList();

    // ▼ 선택 항목을 list-scroll 상단으로 스크롤
    function scrollItemToTop(item) {
        const container = document.querySelector('.list-scroll');
        const itemTop = item.offsetTop;
        container.scrollTop = itemTop;
    }

    // ▼ 키보드 ↑ ↓ 방향키로 리스트 탐색 및 선택 기능
    document.addEventListener('keydown', (e) => {
        const list = document.getElementById('list');
        const items = list.querySelectorAll('.item-box');
        if (!items.length || window.innerWidth <= 768) return;

        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && document.activeElement.id === 'searchInput') {
            e.preventDefault();
            document.getElementById('searchInput').blur();
            const firstItem = items[0];
            if (firstItem) {
                items.forEach(item => item.classList.remove('selected'));
                firstItem.classList.add('selected');
                const dataIndex = firstItem.dataset.index;
                const selectedItem = filteredData[dataIndex];
                if (selectedItem) renderChart(selectedItem);
                scrollItemToTop(firstItem);
            }
            return;
        }

        const selectedIndex = [...items].findIndex(item => item.classList.contains('selected'));
        let nextIndex = selectedIndex;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = selectedIndex + 1 < items.length ? selectedIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = selectedIndex - 1 >= 0 ? selectedIndex - 1 : items.length - 1;
        } else {
            return;
        }

        items.forEach(item => item.classList.remove('selected'));
        const nextItem = items[nextIndex];
        nextItem.classList.add('selected');
        scrollItemToTop(nextItem);
        const dataIndex = nextItem.dataset.index;
        const selectedItem = filteredData[dataIndex];
        if (selectedItem) renderChart(selectedItem);
    });
</script>
