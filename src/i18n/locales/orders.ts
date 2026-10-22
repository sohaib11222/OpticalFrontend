import type { LocaleModule } from "../types";

const en: Record<string, string> = {
  "orders.flow": "Draft → Confirmed → Fulfilled",
  "orders.newOrder": "New order",
  "orders.listTitle": "Order list",
  "orders.searchLabel": "Search orders",
  "orders.searchPlaceholder": "Order number or customer name",
  "orders.statusFilter": "Order status",
  "orders.allStatuses": "All statuses",
  "orders.loading": "Loading orders…",
  "orders.colOrder": "Order",
  "orders.colCustomer": "Customer",
  "orders.viewOrder": "View order",
  "orders.noneMatching": "No matching orders.",

  "orders.refreshOrder": "Refresh order",
  "orders.printSheet": "Print order sheet",
  "orders.editDraft": "Edit draft",
  "orders.inStore": "In-store order ·",
  "orders.itemsTitle": "Order items",
  "orders.colProduct": "Product",
  "orders.colQuantity": "Quantity",
  "orders.colUnitPrice": "Unit price",
  "orders.colLineTotal": "Line total",
  "orders.orderTotal": "Order total: {amount}",
  "orders.salesHistory": "Sales history",
  "orders.colEntry": "Entry",
  "orders.colStockReturned": "Stock returned",
  "orders.fulfilledReason": "Order fulfilled",
  "orders.saleRecordedHint": "A sale is recorded when this order is fulfilled.",
  "orders.historyTitle": "Order history",
  "orders.customerTitle": "Customer",
  "orders.prescriptionNumber": "Prescription #{id}",
  "orders.linkedPrescription": "Linked prescription #{id}",
  "orders.customerRetained":
    "Customer details are retained with the confirmed order.",
  "orders.actionsTitle": "Order actions",
  "orders.notesTitle": "Notes",
  "orders.actionsExplain":
    "Confirmation reserves stock. Fulfilment deducts stock and records the sale. Cancellations release reservations; sale corrections create traceable reversal entries.",

  "orders.action.confirm": "Confirm order",
  "orders.action.fulfil": "Fulfil order",
  "orders.action.cancel": "Cancel order",
  "orders.action.reverse": "Reverse sale",

  "orders.msg.confirm":
    "Reserve every order item. Prices and customer details become fixed.",
  "orders.msg.fulfil":
    "Confirm that the complete order has been handed over. This deducts reserved stock and records one sale.",
  "orders.msg.cancel":
    "Cancel this order and release any reservations. Its history remains available.",
  "orders.msg.reverse":
    "Reverse the full recorded sale. Choose whether all sold units physically return to stock. The original sale remains in history.",

  "orders.checkingLatest": "Checking the latest order.",
  "orders.returnStockQuestion": "Return all sold units to stock?",
  "orders.chooseStockOutcome": "Choose stock outcome",
  "orders.stockReturnedYes": "Yes, all units were returned",
  "orders.stockReturnedNo": "No, keep current stock quantities",
  "orders.updateFailed": "Unable to update order",
  "orders.loadingOrder": "Loading order…",

  "orders.onlyDrafts": "Only draft orders can be edited.",
  "orders.addProduct": "Add at least one product.",
  "orders.saveFailed": "Unable to save order",
  "orders.editOrder": "Edit {number}",
  "orders.draftHint":
    "Save a draft and review prices before confirming stock reservations.",
  "orders.saveDraft": "Save order draft",
  "orders.qtyPositive": "Quantity must be positive",
  "orders.qtyTooLarge": "Quantity too large",
  "orders.qtyWhole": "Use a whole number",
  "orders.chooseCustomer": "Choose a customer",
  "orders.removeSku": "Remove {sku}",
  "orders.quantityFor": "Quantity for {sku}",
  "orders.searchToStart": "Search for an active product to begin.",
  "orders.catalogPricesNote":
    "Saving uses current catalog prices. Review the saved order total before confirmation. Only confirmed orders reserve stock.",
  "orders.notesFieldTitle": "Order notes",
  "orders.notesOptional": "Notes (optional)",
  "orders.prescriptionTitle": "Prescription",
  "orders.linkedPrescriptionOptional": "Linked prescription (optional)",

  "orders.findProducts": "Find products",
  "orders.productSearchPlaceholder": "Search name, SKU, brand, model or color",
  "orders.loadingCatalog": "Loading catalog…",
  "orders.available": "{available} available",
  "orders.addSku": "Add {sku}",

  "orders.printSavePdf": "Print / save PDF",
  "orders.backToOrder": "Back to order",
  "orders.sheetSuffix": "· Order sheet",
  "orders.createdLabel": "Created:",
  "orders.colProductSku": "Product / SKU",
  "orders.orderTotalLabel": "Order total:",
  "orders.saleRecorded": "Sale recorded",
  "orders.saleReversed": "Sale reversed",
  "orders.loadingSheet": "Loading order sheet…",
  "orders.sheetFooter":
    "Operational order record. Tax invoices and payment processing are handled separately.",

  "orders.linkedOrderOptional": "Linked order (optional)",
  "orders.noLinkedOrder": "No linked order",
  "orders.orderNumber": "Order #{value}",
  "orders.previousOrders": "Previous orders",
  "orders.moreOrders": "More orders",
};

const it: Record<string, string> = {
  "orders.flow": "Bozza → Confermato → Evaso",
  "orders.newOrder": "Nuovo ordine",
  "orders.listTitle": "Elenco ordini",
  "orders.searchLabel": "Cerca ordini",
  "orders.searchPlaceholder": "Numero ordine o nome del cliente",
  "orders.statusFilter": "Stato ordine",
  "orders.allStatuses": "Tutti gli stati",
  "orders.loading": "Caricamento ordini…",
  "orders.colOrder": "Ordine",
  "orders.colCustomer": "Cliente",
  "orders.viewOrder": "Visualizza ordine",
  "orders.noneMatching": "Nessun ordine corrispondente.",

  "orders.refreshOrder": "Aggiorna ordine",
  "orders.printSheet": "Stampa foglio ordine",
  "orders.editDraft": "Modifica bozza",
  "orders.inStore": "Ordine in negozio ·",
  "orders.itemsTitle": "Articoli dell'ordine",
  "orders.colProduct": "Prodotto",
  "orders.colQuantity": "Quantità",
  "orders.colUnitPrice": "Prezzo unitario",
  "orders.colLineTotal": "Totale riga",
  "orders.orderTotal": "Totale ordine: {amount}",
  "orders.salesHistory": "Storico vendite",
  "orders.colEntry": "Voce",
  "orders.colStockReturned": "Scorte rese",
  "orders.fulfilledReason": "Ordine evaso",
  "orders.saleRecordedHint":
    "La vendita viene registrata quando l'ordine viene evaso.",
  "orders.historyTitle": "Storico ordine",
  "orders.customerTitle": "Cliente",
  "orders.prescriptionNumber": "Prescrizione #{id}",
  "orders.linkedPrescription": "Prescrizione collegata #{id}",
  "orders.customerRetained":
    "I dati del cliente vengono conservati insieme all'ordine confermato.",
  "orders.actionsTitle": "Azioni ordine",
  "orders.notesTitle": "Note",
  "orders.actionsExplain":
    "La conferma prenota le scorte. L'evasione scarica le scorte e registra la vendita. L'annullamento libera le prenotazioni; le correzioni delle vendite generano voci di storno tracciabili.",

  "orders.action.confirm": "Conferma ordine",
  "orders.action.fulfil": "Evaso ordine",
  "orders.action.cancel": "Annulla ordine",
  "orders.action.reverse": "Storno vendita",

  "orders.msg.confirm":
    "Prenota tutti gli articoli dell'ordine. Prezzi e dati del cliente diventano definitivi.",
  "orders.msg.fulfil":
    "Conferma che l'intero ordine è stato consegnato. Questo scarica le scorte prenotate e registra una vendita.",
  "orders.msg.cancel":
    "Annulla questo ordine e libera le eventuali prenotazioni. Il suo storico resta disponibile.",
  "orders.msg.reverse":
    "Storna l'intera vendita registrata. Scegli se tutte le unità vendute rientrano fisicamente in magazzino. La vendita originale resta nello storico.",

  "orders.checkingLatest": "Verifica dell'ordine più recente.",
  "orders.returnStockQuestion":
    "Rimettere tutte le unità vendute in magazzino?",
  "orders.chooseStockOutcome": "Scegli l'esito per le scorte",
  "orders.stockReturnedYes": "Sì, tutte le unità sono state rese",
  "orders.stockReturnedNo": "No, mantieni le quantità di magazzino attuali",
  "orders.updateFailed": "Impossibile aggiornare l'ordine",
  "orders.loadingOrder": "Caricamento ordine…",

  "orders.onlyDrafts": "Solo gli ordini in bozza possono essere modificati.",
  "orders.addProduct": "Aggiungi almeno un prodotto.",
  "orders.saveFailed": "Impossibile salvare l'ordine",
  "orders.editOrder": "Modifica {number}",
  "orders.draftHint":
    "Salva una bozza e controlla i prezzi prima di confermare le prenotazioni delle scorte.",
  "orders.saveDraft": "Salva bozza ordine",
  "orders.qtyPositive": "La quantità deve essere positiva",
  "orders.qtyTooLarge": "Quantità troppo grande",
  "orders.qtyWhole": "Usa un numero intero",
  "orders.chooseCustomer": "Scegli un cliente",
  "orders.removeSku": "Rimuovi {sku}",
  "orders.quantityFor": "Quantità per {sku}",
  "orders.searchToStart": "Cerca un prodotto attivo per iniziare.",
  "orders.catalogPricesNote":
    "Il salvataggio usa i prezzi attuali del catalogo. Controlla il totale dell'ordine salvato prima della conferma. Solo gli ordini confermati prenotano le scorte.",
  "orders.notesFieldTitle": "Note ordine",
  "orders.notesOptional": "Note (facoltative)",
  "orders.prescriptionTitle": "Prescrizione",
  "orders.linkedPrescriptionOptional": "Prescrizione collegata (facoltativa)",

  "orders.findProducts": "Trova prodotti",
  "orders.productSearchPlaceholder": "Cerca nome, SKU, marca, modello o colore",
  "orders.loadingCatalog": "Caricamento catalogo…",
  "orders.available": "{available} disponibili",
  "orders.addSku": "Aggiungi {sku}",

  "orders.printSavePdf": "Stampa / salva PDF",
  "orders.backToOrder": "Torna all'ordine",
  "orders.sheetSuffix": "· Foglio ordine",
  "orders.createdLabel": "Creato:",
  "orders.colProductSku": "Prodotto / SKU",
  "orders.orderTotalLabel": "Totale ordine:",
  "orders.saleRecorded": "Vendita registrata",
  "orders.saleReversed": "Vendita stornata",
  "orders.loadingSheet": "Caricamento foglio ordine…",
  "orders.sheetFooter":
    "Documento operativo dell'ordine. Le fatture fiscali e l'elaborazione dei pagamenti sono gestite separatamente.",

  "orders.linkedOrderOptional": "Ordine collegato (facoltativo)",
  "orders.noLinkedOrder": "Nessun ordine collegato",
  "orders.orderNumber": "Ordine #{value}",
  "orders.previousOrders": "Ordini precedenti",
  "orders.moreOrders": "Altri ordini",
};

export default { en, it } satisfies LocaleModule;
