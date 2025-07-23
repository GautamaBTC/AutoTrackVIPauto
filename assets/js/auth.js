// Список пользователей (мастера из вашего первого кода + админ)
const users = {
    "admin": { password: "admin009", role: "admin" },
    "Владимир А.": { password: "vlad123", role: "master" },
    "Владимир": { password: "vladimir456", role: "master" },
    "Андрей": { password: "andrey789", role: "master" },
    "Данила": { password: "danila000", role: "master" },
    "Максим": { password: "maxim111", role: "master" },
    "Артём": { password: "artem222", role: "master" }
};

// Обработка формы входа
document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (users[username] && users[username].password === password) {
        localStorage.setItem("auth", JSON.stringify({ username, role: users[username].role }));
        window.location.href = "index.html"; // Перенаправляем в журнал
    } else {
        alert("Неверный логин или пароль!");
    }
});

// Проверка авторизации при загрузке index.html
if (window.location.pathname.endsWith("index.html")) {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (!auth) {
        window.location.href = "login.html"; // Если не авторизован
    }
}