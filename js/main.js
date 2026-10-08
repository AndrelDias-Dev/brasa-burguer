"use strict";

// Troque estes dados quando o cardápio e o WhatsApp oficiais estiverem definidos.
const STORE = {
  whatsappNumber: "5511999999999", // Exemplo fictício: DDI + DDD + número, só dígitos.
  items: [
    { id: "classico", group: "Lanches", name: "Brasa Clássico", description: "Blend na brasa, queijo, alface, tomate e molho da casa.", price: 29.9, image: "assets/images/classic-burger.webp" },
    { id: "bacon", group: "Lanches", name: "Fogo Bacon", description: "Blend na brasa, bacon, cheddar e cebola caramelizada.", price: 34.9, image: "assets/images/bacon-burger.webp" },
    { id: "bbq", group: "Lanches", name: "BBQ Artesanal", description: "Blend na brasa, queijo, barbecue e picles.", price: 32.9, image: "assets/images/bbq-burger.webp" },
    { id: "refri", group: "Bebidas", name: "Refrigerante lata", price: 7 },
    { id: "agua", group: "Bebidas", name: "Água mineral", price: 5 },
    { id: "suco", group: "Bebidas", name: "Suco de laranja", price: 9 },
    { id: "batata", group: "Acompanhamentos", name: "Batata frita", price: 12 },
    { id: "aneis", group: "Acompanhamentos", name: "Anéis de cebola", price: 14 },
  ],
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const quantities = new Map(STORE.items.map((item) => [item.id, 0]));
const dialog = document.querySelector("#order-dialog");
const orderList = document.querySelector("#order-list");
const orderTotal = document.querySelector("#order-total");
const sendButton = document.querySelector("#order-send");
const messagePreview = document.querySelector("#order-message-preview");
const messagePreviewText = document.querySelector("#order-message-text");
const itemById = new Map(STORE.items.map((item) => [item.id, item]));
const orderControls = new Map();
let totalCents = 0;
let selectedCount = 0;
let previousFocus = null;

function renderFeatured() {
  const container = document.querySelector("#featured-products");
  container.innerHTML = STORE.items.filter((item) => item.group === "Lanches").map((item) => `
    <article class="menu-card reveal-on-scroll">
      <div class="menu-image"><img src="${item.image}" alt="${item.name}" width="520" height="380" loading="lazy" decoding="async"></div>
      <div class="menu-body">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-card-bottom">
          <strong class="menu-price">${money.format(item.price)}</strong>
          <button class="menu-add" type="button" data-add-item="${item.id}" aria-label="Adicionar ${item.name} ao pedido">Adicionar</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderOrderList() {
  const groups = ["Lanches", "Bebidas", "Acompanhamentos"];
  orderList.innerHTML = groups.map((group) => `
    <section class="order-group" aria-label="${group}">
      <h3>${group}</h3>
      ${STORE.items.filter((item) => item.group === group).map((item) => `
        <div class="order-item">
          <div class="order-item-info">
            ${item.image ? `<img class="order-thumb" src="${item.image}" alt="" width="520" height="380" loading="lazy" decoding="async">` : `<span class="order-thumb order-thumb-letter" aria-hidden="true">${item.group === "Bebidas" ? "B" : "+"}</span>`}
            <div><span class="order-item-name">${item.name}</span><span class="order-item-price">${money.format(item.price)}</span></div>
          </div>
          <div class="quantity-control" aria-label="Quantidade de ${item.name}">
            <button type="button" data-quantity="-1" data-item="${item.id}" aria-label="Remover uma unidade de ${item.name}">−</button>
            <output id="quantity-${item.id}" aria-live="polite">0</output>
            <button type="button" data-quantity="1" data-item="${item.id}" aria-label="Adicionar uma unidade de ${item.name}">+</button>
          </div>
        </div>
      `).join("")}
    </section>
  `).join("");
  STORE.items.forEach((item) => {
    orderControls.set(item.id, {
      output: document.getElementById(`quantity-${item.id}`),
      minus: orderList.querySelector(`[data-item="${item.id}"][data-quantity="-1"]`),
    });
  });
}

function changeQuantity(id, change) {
  const item = itemById.get(id);
  if (!item) return;

  const previous = quantities.get(id);
  const next = Math.max(0, Math.min(99, previous + change));
  if (next === previous) return;

  quantities.set(id, next);
  const difference = next - previous;
  selectedCount += difference;
  totalCents += difference * Math.round(item.price * 100);

  const control = orderControls.get(id);
  control.output.textContent = next;
  control.minus.disabled = next === 0;
  orderTotal.textContent = money.format(totalCents / 100);
  sendButton.disabled = selectedCount === 0;
  updateMessagePreview();
}

function openOrder() {
  previousFocus = document.activeElement;
  dialog.showModal();
  document.body.classList.add("modal-open");
  dialog.querySelector("[data-close-order]").focus();
}

function closeOrder() {
  dialog.close();
}

function createMessage() {
  const lines = ["Olá, Brasa Burger! Gostaria de fazer um pedido para retirada:"];
  const name = document.querySelector("#customer-name").value.trim();
  const notes = document.querySelector("#order-notes").value.trim();
  if (name) lines.push(`Nome: ${name}`);

  ["Lanches", "Bebidas", "Acompanhamentos"].forEach((group) => {
    const selected = STORE.items.filter((item) => item.group === group && quantities.get(item.id) > 0);
    if (!selected.length) return;
    lines.push("", `*${group}*`);
    selected.forEach((item) => {
      const quantity = quantities.get(item.id);
      lines.push(`${quantity}x ${item.name}`);
    });
  });
  if (notes) lines.push("", `Observações: ${notes}`);
  lines.push("", "Podem confirmar o valor final, a disponibilidade e o horário de retirada?");
  return lines.join("\n");
}

function updateMessagePreview() {
  if (messagePreview.open) messagePreviewText.textContent = createMessage();
}

renderFeatured();
renderOrderList();
messagePreview.addEventListener("toggle", () => {
  updateMessagePreview();
  if (messagePreview.open) {
    const body = dialog.querySelector(".dialog-body");
    body.scrollTop = body.scrollHeight;
  }
});
document.querySelector("#customer-name").addEventListener("input", updateMessagePreview);
document.querySelector("#order-notes").addEventListener("input", updateMessagePreview);

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-item]");
  if (addButton) {
    const id = addButton.dataset.addItem;
    changeQuantity(id, 1);
    openOrder();
    return;
  }
  if (event.target.closest("[data-open-order]")) openOrder();
});

orderList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const id = button.dataset.item;
  const change = Number(button.dataset.quantity);
  changeQuantity(id, change);
});

dialog.querySelector("[data-close-order]").addEventListener("click", closeOrder);
dialog.addEventListener("click", (event) => { if (event.target === dialog) closeOrder(); });
dialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  previousFocus?.focus();
});

sendButton.addEventListener("click", () => {
  if (sendButton.disabled) return;
  const number = STORE.whatsappNumber.replace(/\D/g, "");
  const url = `https://wa.me/${number}?text=${encodeURIComponent(createMessage())}`;
  window.location.assign(url);
});

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.09 });
  document.querySelectorAll(".reveal-on-scroll").forEach((element) => observer.observe(element));
}

const header = document.querySelector(".site-header");
function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 35);
}
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
