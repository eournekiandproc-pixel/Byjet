// ==========================================
// BALANCE PRO / EUBALANCE - COMPLETE ENGINE
// ==========================================

const STORAGE_KEYS = {
    TRANSACTIONS: "balanceProTransactions_v1",
    SETTINGS: "balanceProSettings_v1",
    MONTH: "balanceProSelectedMonth_v1"
};

const SUBCATEGORIES = {
    needs: [
        "Սնունդ և մթերք",
        "Բնակարան և վարձակալություն",
        "Կոմունալ վճարներ",
        "Տրանսպորտ և վառելիք",
        "Առողջապահություն և դեղորայք"
    ],
    wants: [
        "Ռեստորաններ և սրճարաններ",
        "Ժամանց և կինո",
        "Հագուստ և գնումներ",
        "Բաժանորդագրություններ",
        "Ճանապարհորդություն և հանգիստ"
    ],
    savings: [
        "Արտակարգ պահուստ",
        "Բանկային ավանդ",
        "Ներդրումներ",
        "Երկարաժամկետ նպատակ"
    ],
    income: [
        "Ֆրիլանս / Լրացուցիչ աշխատանք",
        "Բոնուս / Պարգևավճար",
        "Դիվիդենտ / Տոկոս",
        "Այլ լրացուցիչ մուտք"
    ]
};

const CATEGORY_LABELS = {
    needs: "Անհրաժեշտ կարիքներ (50%)",
    wants: "Ցանկություններ (30%)",
    savings: "Խնայողություններ (20%)",
    income: "Լրացուցիչ եկամուտ"
};

let transactions = [];
let monthlySettings = {};
let selectedMonth = "";
let barChartInstance = null;
let doughnutChartInstance = null;

const $ = id => document.getElementById(id);

function getCurrentMonthStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function getTodayDateStr(monthStr) {
    const targetMonth = monthStr || selectedMonth || getCurrentMonthStr();
    const now = new Date();
    const curMonth = getCurrentMonthStr();
    if (targetMonth === curMonth) {
        const d = String(now.getDate()).padStart(2, "0");
        return `${targetMonth}-${d}`;
    }
    return `${targetMonth}-15`;
}

function formatAMD(num) {
    const rounded = Math.round(Number(num) || 0);
    return rounded.toLocaleString("hy-AM").replace(/,/g, " ") + " ֏";
}

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

function buildDemoData(monthStr) {
    const m = monthStr || getCurrentMonthStr();
    return {
        settings: {
            [m]: {
                income: 650000,
                limit: 560000,
                reserveGoal: 130000,
                extraIncome: 50000
            }
        },
        transactions: [
            {
                id: "demo-1",
                month: m,
                type: "expense",
                name: "Բնակարանի վարձ և կոմունալներ",
                category: "needs",
                subcategory: "Բնակարան և վարձակալություն",
                amount: 195000,
                date: `${m}-03`
            },
            {
                id: "demo-2",
                month: m,
                type: "expense",
                name: "Ամսական մթերային գնումներ",
                category: "needs",
                subcategory: "Սնունդ և մթերք",
                amount: 125000,
                date: `${m}-07`
            },
            {
                id: "demo-3",
                month: m,
                type: "expense",
                name: "Տրանսպորտ և բժշկական զննում",
                category: "needs",
                subcategory: "Տրանսպորտ և վառելիք",
                amount: 45000,
                date: `${m}-10`
            },
            {
                id: "demo-4",
                month: m,
                type: "expense",
                name: "Ռեստորաններ, սրճարան և ժամանց",
                category: "wants",
                subcategory: "Ռեստորաններ և սրճարաններ",
                amount: 145000,
                date: `${m}-12`
            },
            {
                id: "demo-5",
                month: m,
                type: "expense",
                name: "Հագուստ և բաժանորդագրություններ",
                category: "wants",
                subcategory: "Հագուստ և գնումներ",
                amount: 85000,
                date: `${m}-14`
            },
            {
                id: "demo-6",
                month: m,
                type: "expense",
                name: "Արտակարգ պահուստի համալրում",
                category: "savings",
                subcategory: "Արտակարգ պահուստ",
                amount: 60000,
                date: `${m}-15`
            },
            {
                id: "demo-7",
                month: m,
                type: "income",
                name: "Խորհրդատվական նախագիծ",
                category: "income",
                subcategory: "Ֆրիլանս / Լրացուցիչ աշխատանք",
                amount: 30000,
                date: `${m}-11`
            }
        ]
    };
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(monthlySettings));
    localStorage.setItem(STORAGE_KEYS.MONTH, selectedMonth);
}

function restoreDemoData() {
    const m = selectedMonth || getCurrentMonthStr();
    const demo = buildDemoData(m);
    monthlySettings[m] = demo.settings[m];
    transactions = [
        ...transactions.filter(t => t.month !== m),
        ...demo.transactions
    ];
    saveToStorage();
    loadMonthIntoForm();
    refreshAll();
    showToast("Նախնական ցուցադրական տվյալները վերականգնվեցին։");
}

function clearCurrentMonthData() {
    if (!confirm("Մաքրե՞լ ընթացիկ ամսվա բոլոր գործարքներն ու կարգավորումները։")) return;
    transactions = transactions.filter(t => t.month !== selectedMonth);
    monthlySettings[selectedMonth] = {
        income: 0,
        limit: 0,
        reserveGoal: 0,
        extraIncome: 0
    };
    saveToStorage();
    loadMonthIntoForm();
    refreshAll();
    showToast("Ընթացիկ ամսվա տվյալները մաքրվեցին։");
}

function onMonthChange() {
    selectedMonth = $("selectedMonth").value || getCurrentMonthStr();
    saveToStorage();
    loadMonthIntoForm();
    refreshAll();
}

function loadMonthIntoForm() {
    const s = monthlySettings[selectedMonth] || {
        income: 0,
        limit: 0,
        reserveGoal: 0,
        extraIncome: 0
    };
    $("incomeInput").value = s.income || "";
    $("limitInput").value = s.limit || "";
    $("reserveGoalInput").value = s.reserveGoal || "";
    $("extraIncomeInput").value = s.extraIncome || "";
    $("transactionDate").value = getTodayDateStr(selectedMonth);
}

function apply80PercentLimit() {
    const baseIncome = Number($("incomeInput").value) || 0;
    const extraParamIncome = Number($("extraIncomeInput").value) || 0;
    const monthTxIncome = transactions
        .filter(t => t.month === selectedMonth && t.type === "income")
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalIncome = baseIncome + extraParamIncome + monthTxIncome;
    if (totalIncome <= 0) {
        showToast("Նախ մուտքագրիր ամսական եկամուտը։");
        return;
    }

    const recommended80Limit = Math.round(totalIncome * 0.8);
    $("limitInput").value = recommended80Limit;

    monthlySettings[selectedMonth] = {
        income: baseIncome,
        limit: recommended80Limit,
        reserveGoal: Number($("reserveGoalInput").value) || Math.round(totalIncome * 0.2),
        extraIncome: extraParamIncome
    };
    saveToStorage();
    refreshAll();
    showToast(`Սահմանաչափը ավտոմատ դարձավ 80%՝ ${formatAMD(recommended80Limit)}։`);
}

function saveSettings() {
    const income = Number($("incomeInput").value) || 0;
    const limit = Number($("limitInput").value) || 0;
    const reserveGoal = Number($("reserveGoalInput").value) || 0;
    const extraIncome = Number($("extraIncomeInput").value) || 0;

    if (income <= 0 && extraIncome <= 0) {
        alert("Խնդրում ենք մուտքագրել դրական ամսական կամ լրացուցիչ եկամուտ։");
        return;
    }

    const totalPotentialIncome = income + extraIncome;
    if (limit > totalPotentialIncome && totalPotentialIncome > 0) {
        const proceed = confirm("Ծախսերի առավելագույն սահմանաչափը գերազանցում է ընդհանուր եկամուտը։ Շարունակե՞լ։");
        if (!proceed) return;
    }

    monthlySettings[selectedMonth] = {
        income,
        limit,
        reserveGoal,
        extraIncome
    };
    saveToStorage();
    refreshAll();
    showToast("Բյուջեի կարգավորումները պահպանվեցին։");
}

function updateCategoryOptions() {
    const type = $("transactionType").value;
    const catSelect = $("transactionCategory");
    catSelect.innerHTML = "";

    if (type === "income") {
        catSelect.innerHTML = `<option value="income">Լրացուցիչ եկամուտ</option>`;
    } else {
        catSelect.innerHTML = `
            <option value="needs">Անհրաժեշտ կարիքներ (50%)</option>
            <option value="wants">Ցանկություններ (30%)</option>
            <option value="savings">Խնայողություններ (20%)</option>
        `;
    }
    updateSubcategoryOptions();
}

function updateSubcategoryOptions() {
    const cat = $("transactionCategory").value;
    const subSelect = $("transactionSubcategory");
    const list = SUBCATEGORIES[cat] || ["Այլ"];
    subSelect.innerHTML = list.map(item => `<option value="${item}">${item}</option>`).join("");
}

function addTransaction() {
    const type = $("transactionType").value;
    const name = $("transactionName").value.trim();
    const category = $("transactionCategory").value;
    const subcategory = $("transactionSubcategory").value;
    const amount = Number($("transactionAmount").value);
    const date = $("transactionDate").value;

    if (!name || !amount || amount <= 0) {
        alert("Խնդրում ենք մուտքագրել գործարքի անվանումը և դրական գումար։");
        return;
    }

    if (!date) {
        alert("Խնդրում ենք ընտրել գործարքի ամսաթիվը։");
        return;
    }

    const txMonth = date.slice(0, 7);
    if (txMonth !== selectedMonth) {
        selectedMonth = txMonth;
        $("selectedMonth").value = txMonth;
        loadMonthIntoForm();
    }

    transactions.push({
        id: "tx-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        month: txMonth,
        type,
        name,
        category,
        subcategory,
        amount,
        date
    });

    saveToStorage();
    $("transactionName").value = "";
    $("transactionAmount").value = "";
    refreshAll();
    showToast("Գործարքը հաջողությամբ ավելացվեց։");
}

function deleteTransaction(id) {
    if (!confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս գործարքը։")) return;
    transactions = transactions.filter(t => t.id !== id);
    saveToStorage();
    refreshAll();
    showToast("Գործարքը ջնջվեց։");
}

function getMonthMetrics() {
    const s = monthlySettings[selectedMonth] || {
        income: 0,
        limit: 0,
        reserveGoal: 0,
        extraIncome: 0
    };

    const monthTx = transactions.filter(t => t.month === selectedMonth);

    const txExtraIncome = monthTx
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalIncome = (Number(s.income) || 0) + (Number(s.extraIncome) || 0) + txExtraIncome;

    const needsActual = monthTx
        .filter(t => t.type === "expense" && t.category === "needs")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const wantsActual = monthTx
        .filter(t => t.type === "expense" && t.category === "wants")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const savingsActual = monthTx
        .filter(t => t.type === "expense" && t.category === "savings")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalSpent = needsActual + wantsActual + savingsActual;
    const balance = totalIncome - totalSpent;

    const needsTarget = totalIncome * 0.5;
    const wantsTarget = totalIncome * 0.3;
    const savingsTarget = totalIncome * 0.2;

    const limit = Number(s.limit) || 0;
    const reserveGoal = Number(s.reserveGoal) || Math.round(savingsTarget);

    const deficit = Math.max(0, totalSpent - totalIncome);
    const needsDiff = Math.abs(needsActual - needsTarget);
    const wantsDiff = Math.abs(wantsActual - wantsTarget);
    const savingsDiff = Math.abs(savingsActual - savingsTarget);
    const deviationScore = totalIncome > 0 ? Math.round((needsDiff + wantsDiff + savingsDiff) / 2) : 0;
    const wantsExcess = Math.max(0, wantsActual - wantsTarget);

    const rawBalancedLimit = needsActual + Math.min(wantsActual, wantsTarget) + reserveGoal;
    const suggestedLimit = totalIncome > 0
        ? Math.min(Math.round(totalIncome * 0.85), Math.max(Math.round(needsActual + reserveGoal), Math.round(rawBalancedLimit)))
        : Math.round(rawBalancedLimit);

    return {
        s,
        monthTx,
        txExtraIncome,
        totalIncome,
        totalSpent,
        balance,
        needsActual,
        wantsActual,
        savingsActual,
        needsTarget,
        wantsTarget,
        savingsTarget,
        limit,
        reserveGoal,
        deficit,
        deviationScore,
        wantsExcess,
        suggestedLimit
    };
}

function renderDashboard(m) {
    $("incomeValue").textContent = formatAMD(m.totalIncome);
    $("incomeBreakdownSub").textContent =
        `Հիմնական ${formatAMD(m.s.income || 0)} + Լրաց. ${formatAMD((m.s.extraIncome || 0) + m.txExtraIncome)}`;

    $("spentValue").textContent = formatAMD(m.totalSpent);
    $("spentBreakdownSub").textContent =
        `Կարիք ${formatAMD(m.needsActual)} • Ցանկ. ${formatAMD(m.wantsActual)}`;

    const balEl = $("balanceValue");
    balEl.textContent = formatAMD(m.balance);
    balEl.classList.toggle("negative-text", m.balance < 0);

    $("savingValue").textContent = formatAMD(m.savingsActual);
    $("reserveGoalSub").textContent = `Պահուստի նպատակ՝ ${formatAMD(m.reserveGoal)}`;

    const pct = m.limit > 0 ? (m.totalSpent / m.limit) * 100 : 0;
    const visualPct = Math.min(100, Math.max(0, pct));
    const bar = $("limitProgress");
    bar.style.width = visualPct.toFixed(1) + "%";

    if (m.limit <= 0) {
        bar.style.background = "var(--green)";
        $("limitPercent").textContent = "0%";
        $("limitMessage").textContent = "Սահմանեք ծախսերի առավելագույն սահմանաչափը կամ սեղմեք «Ավտոմատ 80% սահմանաչափ»։";
    } else if (m.totalSpent > m.limit) {
        bar.style.background = "var(--red)";
        $("limitPercent").textContent = pct.toFixed(1) + "%";
        $("limitMessage").textContent = `Սահմանաչափը գերազանցվել է ${formatAMD(m.totalSpent - m.limit)}-ով (սահմանաչափ՝ ${formatAMD(m.limit)})։`;
    } else if (pct >= 80) {
        bar.style.background = "var(--orange)";
        $("limitPercent").textContent = pct.toFixed(1) + "%";
        $("limitMessage").textContent = `Մոտենում եք սահմանաչափին․ մնացել է ${formatAMD(m.limit - m.totalSpent)}։`;
    } else {
        bar.style.background = "var(--green)";
        $("limitPercent").textContent = pct.toFixed(1) + "%";
        $("limitMessage").textContent = `Սահմանաչափի շրջանակում եք․ մնացել է ${formatAMD(m.limit - m.totalSpent)}։`;
    }

    $("rebalanceDeficit").textContent = formatAMD(m.deficit);
    $("rebalanceDeficit").style.color = m.deficit > 0 ? "var(--red)" : "var(--green)";
    $("rebalanceDeviation").textContent = formatAMD(m.deviationScore);
    $("rebalanceWantsExcess").textContent = formatAMD(m.wantsExcess);
    $("rebalanceWantsExcess").style.color = m.wantsExcess > 0 ? "var(--orange)" : "var(--green)";
    $("rebalanceSuggestedLimit").textContent = formatAMD(m.suggestedLimit);

    const reserveShortfall = Math.max(0, m.reserveGoal - m.savingsActual);
    if (m.totalIncome <= 0) {
        $("rebalanceSummaryText").textContent =
            "Մուտքագրիր ամսական եկամուտը՝ ավտոմատ հավասարակշռման հաշվարկ կատարելու համար։";
    } else if (m.deficit > 0 || m.wantsExcess > 0 || reserveShortfall > 0) {
        $("rebalanceSummaryText").innerHTML =
            `Հայտնաբերվել է՝ դեֆիցիտ <strong>${formatAMD(m.deficit)}</strong>, ցանկությունների ավելցուկ <strong>${formatAMD(m.wantsExcess)}</strong> և պահուստի թերակատարում <strong>${formatAMD(reserveShortfall)}</strong>։ ` +
            `«Կիրառել հավասարակշռված պլանը» կոճակը կօպտիմալացնի ցանկությունների ծախսերը, կհամալրի պահուստը մինչև ${formatAMD(m.reserveGoal)} և սահմանաչափը կդարձնի ${formatAMD(m.suggestedLimit)}։`;
    } else {
        $("rebalanceSummaryText").textContent =
            "Գերազանց արդյունք․ բյուջեն հավասարակշռված է, դեֆիցիտ չկա, և պահուստային նպատակը պահպանված է։";
    }

    const statusCard = $("balanceStatus");
    statusCard.classList.remove("warning", "danger");

    if (m.totalIncome <= 0 && m.totalSpent === 0) {
        statusCard.innerHTML = `
            <h3>Ֆինանսական կարգավիճակ</h3>
            <p>Մուտքագրիր եկամուտն ու գործարքները՝ բյուջեի ամբողջական գնահատական ստանալու համար։</p>
        `;
    } else if (m.balance < 0) {
        statusCard.classList.add("danger");
        statusCard.innerHTML = `
            <h3>Բյուջեն դեֆիցիտային է (${formatAMD(Math.abs(m.balance))})</h3>
            <p>Ծախսերը գերազանցել են եկամուտը։ Կիրառիր «Կիրառել հավասարակշռված պլանը» կոճակը կամ կրճատիր ցանկությունների ծախսերը։</p>
        `;
    } else if (m.limit > 0 && m.totalSpent > m.limit) {
        statusCard.classList.add("warning");
        statusCard.innerHTML = `
            <h3>Սահմանաչափը գերազանցվել է</h3>
            <p>Եկամուտը դրական է, սակայն ծախսերը գերազանցել են սահմանված սահմանաչափը ${formatAMD(m.totalSpent - m.limit)}-ով։</p>
        `;
    } else if (m.wantsExcess > 0 || reserveShortfall > 0) {
        statusCard.classList.add("warning");
        statusCard.innerHTML = `
            <h3>Բյուջեն մասամբ հավասարակշռված է</h3>
            <p>Մնացորդը դրական է (${formatAMD(m.balance)}), սակայն 50/30/20 կամ պահուստային նպատակներում կա շեղում։</p>
        `;
    } else {
        statusCard.innerHTML = `
            <h3>Բյուջեն հավասարակշռված է</h3>
            <p>Ծախսերը չեն գերազանցում եկամուտը, սահմանաչափը պահպանված է, և ֆինանսական կառուցվածքը կայուն է։</p>
        `;
    }
}

function applyBalancedPlan() {
    const m = getMonthMetrics();
    if (m.totalIncome <= 0) {
        showToast("Նախ մուտքագրիր եկամուտը։");
        return;
    }

    const wantsTx = transactions.filter(t => t.month === selectedMonth && t.type === "expense" && t.category === "wants");
    const currentWantsTotal = wantsTx.reduce((s, t) => s + Number(t.amount || 0), 0);
    const targetWantsCap = Math.max(0, Math.round(m.wantsTarget));

    if (currentWantsTotal > targetWantsCap && wantsTx.length > 0) {
        const ratio = targetWantsCap / currentWantsTotal;
        let runningSum = 0;
        wantsTx.forEach((tx, idx) => {
            if (idx === wantsTx.length - 1) {
                tx.amount = Math.max(0, targetWantsCap - runningSum);
            } else {
                const scaled = Math.round(Number(tx.amount) * ratio);
                tx.amount = scaled;
                runningSum += scaled;
            }
        });
        transactions = transactions.filter(t => Number(t.amount) > 0 || t.month !== selectedMonth);
    }

    const updatedSavings = transactions
        .filter(t => t.month === selectedMonth && t.type === "expense" && t.category === "savings")
        .reduce((s, t) => s + Number(t.amount || 0), 0);

    const neededReserveTopUp = Math.max(0, Math.round(m.reserveGoal - updatedSavings));
    if (neededReserveTopUp > 0) {
        transactions.push({
            id: "rebal-sav-" + Date.now(),
            month: selectedMonth,
            type: "expense",
            name: "Պահուստի ավտոմատ համալրում (Auto-Balance)",
            category: "savings",
            subcategory: "Արտակարգ պահուստ",
            amount: neededReserveTopUp,
            date: getTodayDateStr(selectedMonth)
        });
    }

    const updatedMetrics = getMonthMetrics();
    const newLimit = Math.max(updatedMetrics.suggestedLimit, updatedMetrics.totalSpent);

    monthlySettings[selectedMonth] = {
        income: Number(m.s.income) || 0,
        limit: newLimit,
        reserveGoal: Math.round(m.reserveGoal),
        extraIncome: Number(m.s.extraIncome) || 0
    };

    saveToStorage();
    loadMonthIntoForm();
    refreshAll();
    showToast(`Հավասարակշռված պլանը կիրառվեց․ սահմանաչափը՝ ${formatAMD(newLimit)}։`);
}

function renderTransactions(m) {
    const metrics = m || getMonthMetrics();
    const search = ($("filterSearch").value || "").trim().toLowerCase();
    const catFilter = $("filterCategory").value;
    const sortBy = $("filterSort").value;

    let list = [...metrics.monthTx];

    if (catFilter !== "all") {
        list = list.filter(t => t.category === catFilter);
    }

    if (search) {
        list = list.filter(t =>
            t.name.toLowerCase().includes(search) ||
            (t.subcategory || "").toLowerCase().includes(search) ||
            (CATEGORY_LABELS[t.category] || "").toLowerCase().includes(search)
        );
    }

    list.sort((a, b) => {
        if (sortBy === "date_desc") return b.date.localeCompare(a.date);
        if (sortBy === "date_asc") return a.date.localeCompare(b.date);
        if (sortBy === "amount_desc") return Number(b.amount) - Number(a.amount);
        if (sortBy === "amount_asc") return Number(a.amount) - Number(b.amount);
        return 0;
    });

    $("transactionCount").textContent = `${list.length} գործարք`;

    const container = $("transactionList");
    if (!list.length) {
        container.innerHTML = `<p class="empty">Ընտրված զտիչներով գործարքներ չեն գտնվել։</p>`;
        return;
    }

    container.innerHTML = list.map(tx => {
        const isIncome = tx.type === "income";
        const badgeClass =
            tx.category === "needs" ? "badge-needs" :
            tx.category === "wants" ? "badge-wants" :
            tx.category === "savings" ? "badge-savings" : "badge-income";

        const catTitle = CATEGORY_LABELS[tx.category] || "Այլ";
        const subTitle = tx.subcategory ? ` • ${tx.subcategory}` : "";

        return `
            <div class="transaction-item">
                <div>
                    <strong>
                        ${escapeHtml(tx.name)}
                        <span class="badge ${badgeClass}">${catTitle}</span>
                    </strong>
                    <small>${tx.date}${subTitle}</small>
                </div>
                <div class="transaction-right">
                    <b class="${isIncome ? "positive" : "negative"}">
                        ${isIncome ? "+" : "−"}${formatAMD(tx.amount)}
                    </b>
                    <button type="button" class="delete-btn" onclick="deleteTransaction('${tx.id}')" title="Ջնջել">✕</button>
                </div>
            </div>
        `;
    }).join("");
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderRuleAndCharts(m) {
    $("needsTarget").textContent = formatAMD(m.needsTarget);
    $("wantsTarget").textContent = formatAMD(m.wantsTarget);
    $("savingsTarget").textContent = formatAMD(m.savingsTarget);

    const needsPct = m.totalIncome > 0 ? (m.needsActual / m.totalIncome) * 100 : 0;
    const wantsPct = m.totalIncome > 0 ? (m.wantsActual / m.totalIncome) * 100 : 0;
    const savingsPct = m.totalIncome > 0 ? (m.savingsActual / m.totalIncome) * 100 : 0;

    const needsBarPct = m.needsTarget > 0 ? Math.min(100, (m.needsActual / m.needsTarget) * 100) : 0;
    const wantsBarPct = m.wantsTarget > 0 ? Math.min(100, (m.wantsActual / m.wantsTarget) * 100) : 0;
    const savingsBarPct = m.savingsTarget > 0 ? Math.min(100, (m.savingsActual / m.savingsTarget) * 100) : 0;

    $("needsProgress").style.width = needsBarPct.toFixed(1) + "%";
    $("wantsProgress").style.width = wantsBarPct.toFixed(1) + "%";
    $("savingsProgress").style.width = savingsBarPct.toFixed(1) + "%";

    $("needsActual").textContent = `Փաստացի՝ ${formatAMD(m.needsActual)} (${needsPct.toFixed(1)}%)`;
    $("wantsActual").textContent = `Փաստացի՝ ${formatAMD(m.wantsActual)} (${wantsPct.toFixed(1)}%)`;
    $("savingsActual").textContent = `Փաստացի՝ ${formatAMD(m.savingsActual)} (${savingsPct.toFixed(1)}%)`;

    const analysisEl = $("ruleAnalysis");
    if (m.totalIncome <= 0) {
        analysisEl.innerHTML = `<div class="analysis-item info">Նախ մուտքագրիր ամսական եկամուտը՝ 50/30/20 կանոնի վերլուծությունը տեսնելու համար։</div>`;
    } else {
        const items = [];

        if (m.needsActual > m.needsTarget) {
            items.push(`<div class="analysis-item danger">Անհրաժեշտ կարիքները գերազանցել են 50% նպատակը ${formatAMD(m.needsActual - m.needsTarget)}-ով։</div>`);
        } else {
            items.push(`<div class="analysis-item">Անհրաժեշտ կարիքները կազմում են ${needsPct.toFixed(1)}% (նպատակ՝ 50%)։</div>`);
        }

        if (m.wantsActual > m.wantsTarget) {
            items.push(`<div class="analysis-item warning">Ցանկությունների ծախսերը գերազանցել են 30% նպատակը ${formatAMD(m.wantsActual - m.wantsTarget)}-ով։</div>`);
        } else {
            items.push(`<div class="analysis-item">Ցանկությունների ծախսերը կազմում են ${wantsPct.toFixed(1)}% (նպատակ՝ 30%)։</div>`);
        }

        if (m.savingsActual < m.savingsTarget) {
            items.push(`<div class="analysis-item warning">Խնայողություններին նպատակայինից (20%) պակաս է ուղղվել ${formatAMD(m.savingsTarget - m.savingsActual)}-ով։</div>`);
        } else {
            items.push(`<div class="analysis-item">Խնայողությունները կազմում են ${savingsPct.toFixed(1)}% (նպատակ՝ 20% կամ ավելի)։</div>`);
        }

        if (m.deficit > 0) {
            items.push(`<div class="analysis-item danger">Առկա է ${formatAMD(m.deficit)} դեֆիցիտ․ ծախսերը գերազանցում են ընդհանուր եկամուտը։</div>`);
        }

        analysisEl.innerHTML = items.join("");
    }

    updateCharts(m);
}

function updateCharts(m) {
    const barCanvas = $("budgetBarChart");
    const doughnutCanvas = $("budgetDoughnutChart");
    if (!barCanvas || !doughnutCanvas || typeof Chart === "undefined") return;

    if (barChartInstance) {
        barChartInstance.destroy();
    }
    if (doughnutChartInstance) {
        doughnutChartInstance.destroy();
    }

    barChartInstance = new Chart(barCanvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Կարիքներ (50%)", "Ցանկություններ (30%)", "Խնայողություն (20%)"],
            datasets: [
                {
                    label: "Նպատակային (֏)",
                    data: [
                        Math.round(m.needsTarget),
                        Math.round(m.wantsTarget),
                        Math.round(m.savingsTarget)
                    ],
                    backgroundColor: "rgba(145, 160, 185, 0.35)",
                    borderColor: "#91a0b9",
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: "Փաստացի (֏)",
                    data: [
                        Math.round(m.needsActual),
                        Math.round(m.wantsActual),
                        Math.round(m.savingsActual)
                    ],
                    backgroundColor: ["#39dfa0", "#638cff", "#ffbd59"],
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: "#cfd9e8", font: { size: 11 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#91a0b9", font: { size: 11 } },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#91a0b9", font: { size: 11 } },
                    grid: { color: "rgba(255,255,255,0.06)" }
                }
            }
        }
    });

    const hasExpenseData = (m.needsActual + m.wantsActual + m.savingsActual) > 0;
    doughnutChartInstance = new Chart(doughnutCanvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Անհրաժեշտ կարիքներ", "Ցանկություններ", "Խնայողություններ"],
            datasets: [{
                data: hasExpenseData
                    ? [Math.round(m.needsActual), Math.round(m.wantsActual), Math.round(m.savingsActual)]
                    : [50, 30, 20],
                backgroundColor: ["#39dfa0", "#638cff", "#ffbd59"],
                borderColor: "#152137",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#cfd9e8", font: { size: 11 }, padding: 14 }
                }
            }
        }
    });
}

function calculateDeposit() {
    const amount = Number($("depositAmount").value);
    const rate = Number($("depositRate").value);
    const months = parseInt($("depositMonths").value, 10);
    const type = $("depositType").value;

    if (!amount || amount <= 0 || isNaN(rate) || rate < 0 || !months || months <= 0) {
        alert("Խնդրում ենք մուտքագրել ավանդի ճիշտ գումարը, տոկոսադրույքն ու ամիսների քանակը։");
        return;
    }

    let finalAmount = amount;
    if (type === "simple") {
        finalAmount = amount + amount * (rate / 100) * (months / 12);
    } else {
        const monthlyRate = (rate / 100) / 12;
        finalAmount = amount * Math.pow(1 + monthlyRate, months);
    }

    const profit = Math.max(0, finalAmount - amount);

    $("depositFinal").textContent = formatAMD(finalAmount);
    $("depositInitial").textContent = formatAMD(amount);
    $("depositProfit").textContent = formatAMD(profit);
    $("depositPeriod").textContent = `${months} ամիս (${type === "compound" ? "բարդ տոկոս" : "պարզ տոկոս"})`;
}

function renderRecommendations(m) {
    const adviceBox = $("smartAdvice");
    if (m.totalIncome <= 0 && m.totalSpent === 0) {
        adviceBox.innerHTML = `<div class="advice-item info">Գրանցիր քո եկամուտն ու գործարքները՝ անհատական ֆինանսական խորհուրդներ ստանալու համար։</div>`;
        return;
    }

    const tips = [];

    if (m.deficit > 0) {
        tips.push(`<div class="advice-item danger"><strong>Դեֆիցիտի կարգավորում․</strong> Ծախսերը գերազանցել են եկամուտը ${formatAMD(m.deficit)}-ով։ Նախ կրճատիր ցանկությունների գնումները կամ սեղմիր «Կիրառել հավասարակշռված պլանը» կոճակը։</div>`);
    } else if (m.balance > 0) {
        tips.push(`<div class="advice-item"><strong>Դրական մնացորդ․</strong> Այս ամսվա մնացորդը ${formatAMD(m.balance)} է։ Այդ միջոցների մի մասը կարող ես ուղղել պահուստի կամ ներդրումային ավանդի։</div>`);
    }

    if (m.wantsExcess > 0) {
        tips.push(`<div class="advice-item warning"><strong>Ցանկությունների օպտիմալացում․</strong> Ցանկությունների վրա ծախսվել է ${formatAMD(m.wantsExcess)}-ով ավելի, քան 30% նպատակն է։ Կիրառիր 24 ժամ սպասելու կանոնը և վերանայիր բաժանորդագրությունները։</div>`);
    }

    if (m.needsActual > m.needsTarget && m.totalIncome > 0) {
        tips.push(`<div class="advice-item warning"><strong>Անհրաժեշտ ծախսերի վերահսկում․</strong> Կարիքների բաժինը գերազանցել է 50% սահմանը ${formatAMD(m.needsActual - m.needsTarget)}-ով։ Համեմատիր մթերային ու կոմունալ ծախսերը՝ առանց վնասելու առողջությանն ու անվտանգությանը։</div>`);
    }

    const reserveShortfall = Math.max(0, m.reserveGoal - m.savingsActual);
    if (reserveShortfall > 0) {
        tips.push(`<div class="advice-item info"><strong>Պահուստի համալրում․</strong> Ամսական պահուստի նպատակին (${formatAMD(m.reserveGoal)}) պակասում է ${formatAMD(reserveShortfall)}։ Աշխատիր գումարը փոխանցել ամսվա սկզբին։</div>`);
    } else if (m.reserveGoal > 0) {
        tips.push(`<div class="advice-item"><strong>Պահուստի նպատակը կատարված է․</strong> Դուք հասել եք ամսական պահուստի նպատակին (${formatAMD(m.reserveGoal)})։</div>`);
    }

    if (m.limit > 0 && m.totalSpent > m.limit) {
        tips.push(`<div class="advice-item danger"><strong>Սահմանաչափի գերազանցում․</strong> Ծախսերը գերազանցել են սահմանաչափը ${formatAMD(m.totalSpent - m.limit)}-ով։</div>`);
    }

    tips.push(`<div class="advice-item info"><strong>Երկարաժամկետ անվտանգություն․</strong> Ձևավորիր առնվազն 3–6 ամսվա անհրաժեշտ ծախսերին համարժեք արտակարգ պահուստ՝ պահելով այն հասանելի հաշվում։</div>`);

    adviceBox.innerHTML = tips.join("");
}

function updateDateDisplay() {
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
    $("currentDate").textContent = now.toLocaleDateString("hy-AM", options);
}

function setupNavActiveOnScroll() {
    const sections = document.querySelectorAll("main section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        let currentId = "dashboard";
        sections.forEach(sec => {
            const top = sec.offsetTop - 130;
            if (window.scrollY >= top) {
                currentId = sec.getAttribute("id");
            }
        });
        navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
        });
    });
}

function refreshAll() {
    const metrics = getMonthMetrics();
    renderDashboard(metrics);
    renderTransactions(metrics);
    renderRuleAndCharts(metrics);
    renderRecommendations(metrics);
}

function initApp() {
    updateDateDisplay();

    const savedMonth = localStorage.getItem(STORAGE_KEYS.MONTH);
    selectedMonth = savedMonth || getCurrentMonthStr();
    $("selectedMonth").value = selectedMonth;

    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (rawTx && rawSettings) {
        transactions = JSON.parse(rawTx);
        monthlySettings = JSON.parse(rawSettings);
    } else {
        const demo = buildDemoData(selectedMonth);
        monthlySettings = demo.settings;
        transactions = demo.transactions;
        saveToStorage();
    }

    if (!monthlySettings[selectedMonth]) {
        monthlySettings[selectedMonth] = {
            income: 650000,
            limit: 560000,
            reserveGoal: 130000,
            extraIncome: 50000
        };
    }

    loadMonthIntoForm();
    updateCategoryOptions();
    calculateDeposit();
    setupNavActiveOnScroll();
    refreshAll();
}

document.addEventListener("DOMContentLoaded", initApp);