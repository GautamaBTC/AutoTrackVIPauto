document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.bonus-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', updateTotal);
    });

    function updateTotal(event) {
        const row = event.target.closest('tr');
        const earned = parseFloat(row.querySelector('td:nth-child(2)').textContent) || 0;
        const bonus = parseInt(event.target.value);
        const total = earned + (bonus * 1000); // Пример: 1 балл = 1000 руб. (настрой под себя, или сделай %)
        row.querySelector('.total').textContent = `${total} руб.`;
    }

    // Кнопка отчёта (пока просто alert, позже PDF)
    document.getElementById('generate-report').addEventListener('click', () => {
        alert('Отчёт сгенерирован! (В будущем - PDF с данными)');
    });

    // Инициализация тоталов
    sliders.forEach(slider => updateTotal({ target: slider }));
});