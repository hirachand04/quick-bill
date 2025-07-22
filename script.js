// QuickBill JavaScript - Main Application Logic

class QuickBill {
    constructor() {
        this.invoiceCounter = 1;
        this.items = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.updatePreview();
        this.loadTheme();
    }

    setupEventListeners() {
        // Form inputs
        document.getElementById('clientName').addEventListener('input', () => this.updatePreview());
        document.getElementById('clientAddress').addEventListener('input', () => this.updatePreview());
        document.getElementById('invoiceNumber').addEventListener('input', () => this.updatePreview());
        document.getElementById('invoiceDate').addEventListener('change', () => this.updatePreview());
        document.getElementById('currency').addEventListener('change', () => this.calculateTotals());
        document.getElementById('taxRate').addEventListener('input', () => this.calculateTotals());
        document.getElementById('discount').addEventListener('input', () => this.calculateTotals());

        // Buttons
        document.getElementById('generateInvoiceNumber').addEventListener('click', () => this.generateInvoiceNumber());
        document.getElementById('addItem').addEventListener('click', () => this.addItem());
        document.getElementById('downloadPDF').addEventListener('click', () => this.downloadPDF());
        document.getElementById('downloadJPG').addEventListener('click', () => this.downloadJPG());
        document.getElementById('printInvoice').addEventListener('click', () => this.printInvoice());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Item inputs (delegated event handling)
        document.getElementById('itemsList').addEventListener('input', (e) => {
            if (e.target.classList.contains('item-name') || 
                e.target.classList.contains('item-quantity') || 
                e.target.classList.contains('item-rate')) {
                this.updateItemAmount(e.target.closest('.item-row'));
                this.calculateTotals();
            }
        });

        document.getElementById('itemsList').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) {
                this.removeItem(e.target.closest('.item-row'));
            }
        });

        // Contenteditable preview updates
        document.getElementById('previewClientName').addEventListener('input', (e) => {
            document.getElementById('clientName').value = e.target.textContent;
        });
        
        document.getElementById('previewClientAddress').addEventListener('input', (e) => {
            document.getElementById('clientAddress').value = e.target.textContent;
        });
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const number = String(this.invoiceCounter).padStart(3, '0');
        const invoiceNumber = `INV-${year}-${number}`;
        document.getElementById('invoiceNumber').value = invoiceNumber;
        this.invoiceCounter++;
        this.updatePreview();
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
    }

    addItem() {
        const itemsList = document.getElementById('itemsList');
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <input type="text" placeholder="Item name" class="item-name" required>
            <input type="number" placeholder="Qty" class="item-quantity" min="1" value="1" required>
            <input type="number" placeholder="Rate" class="item-rate" min="0" step="0.01" required>
            <span class="item-amount">$0.00</span>
            <button type="button" class="remove-item">×</button>
        `;
        itemsList.appendChild(itemRow);
        
        // Add fade-in animation
        itemRow.style.opacity = '0';
        itemRow.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            itemRow.style.transition = 'all 0.3s ease';
            itemRow.style.opacity = '1';
            itemRow.style.transform = 'translateY(0)';
        }, 10);
    }

    removeItem(itemRow) {
        if (document.querySelectorAll('.item-row').length > 1) {
            itemRow.style.transition = 'all 0.3s ease';
            itemRow.style.opacity = '0';
            itemRow.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                itemRow.remove();
                this.calculateTotals();
            }, 300);
        } else {
            // Clear the last item instead of removing it
            const inputs = itemRow.querySelectorAll('input');
            inputs.forEach(input => input.value = input.type === 'number' && input.classList.contains('item-quantity') ? '1' : '');
            this.updateItemAmount(itemRow);
            this.calculateTotals();
        }
    }

    updateItemAmount(itemRow) {
        const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
        const rate = parseFloat(itemRow.querySelector('.item-rate').value) || 0;
        const amount = quantity * rate;
        itemRow.querySelector('.item-amount').textContent = this.formatCurrency(amount);
    }

    calculateTotals() {
        let subtotal = 0;
        const itemRows = document.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            subtotal += quantity * rate;
        });

        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount - discount;

        // Update form totals
        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('taxAmount').textContent = this.formatCurrency(taxAmount);
        document.getElementById('discountAmount').textContent = this.formatCurrency(discount);
        document.getElementById('finalTotal').textContent = this.formatCurrency(total);

        // Update preview totals
        document.getElementById('previewSubtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('previewTax').textContent = this.formatCurrency(taxAmount);
        document.getElementById('previewDiscount').textContent = this.formatCurrency(discount);
        document.getElementById('previewTotal').textContent = this.formatCurrency(total);

        this.updatePreviewItems();
    }

    updatePreview() {
        // Update basic info
        const clientName = document.getElementById('clientName').value || 'Client Name';
        const clientAddress = document.getElementById('clientAddress').value || '';
        const invoiceNumber = document.getElementById('invoiceNumber').value || '-';
        const invoiceDate = document.getElementById('invoiceDate').value || '-';

        document.getElementById('previewClientName').textContent = clientName;
        document.getElementById('previewClientAddress').textContent = clientAddress;
        document.getElementById('previewInvoiceNumber').textContent = invoiceNumber;
        document.getElementById('previewDate').textContent = this.formatDate(invoiceDate);

        this.calculateTotals();
    }

    updatePreviewItems() {
        const itemRows = document.querySelectorAll('.item-row');
        const previewTable = document.getElementById('previewItemsTable');
        
        // Clear existing rows
        previewTable.innerHTML = '';

        let hasItems = false;
        itemRows.forEach(row => {
            const name = row.querySelector('.item-name').value;
            const quantity = row.querySelector('.item-quantity').value;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            
            if (name.trim()) {
                hasItems = true;
                const amount = quantity * rate;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${name}</td>
                    <td>${quantity}</td>
                    <td>${this.formatCurrency(rate)}</td>
                    <td>${this.formatCurrency(amount)}</td>
                `;
                previewTable.appendChild(tr);
            }
        });

        if (!hasItems) {
            previewTable.innerHTML = '<tr><td colspan="4" class="no-items">No items added</td></tr>';
        }
    }

    formatCurrency(amount) {
        const currency = document.getElementById('currency').value || 'USD';
        const currencyMap = {
            'USD': { locale: 'en-US', currency: 'USD' },
            'INR': { locale: 'en-IN', currency: 'INR' },
            'EUR': { locale: 'de-DE', currency: 'EUR' },
            'GBP': { locale: 'en-GB', currency: 'GBP' },
            'CAD': { locale: 'en-CA', currency: 'CAD' },
            'AUD': { locale: 'en-AU', currency: 'AUD' }
        };
        
        const config = currencyMap[currency] || currencyMap['USD'];
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async downloadPDF() {
        const { jsPDF } = window.jspdf;
        const element = document.getElementById('invoicePreview');
        
        try {
            // Show loading state
            const button = document.getElementById('downloadPDF');
            const originalText = button.textContent;
            button.textContent = '⏳ Generating PDF...';
            button.disabled = true;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const invoiceNumber = document.getElementById('invoiceNumber').value || 'invoice';
            pdf.save(`${invoiceNumber}.pdf`);

            // Reset button
            button.textContent = originalText;
            button.disabled = false;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
            
            // Reset button
            const button = document.getElementById('downloadPDF');
            button.textContent = '📄 Download PDF';
            button.disabled = false;
        }
    }

    async downloadJPG() {
        const element = document.getElementById('invoicePreview');
        
        try {
            // Show loading state
            const button = document.getElementById('downloadJPG');
            const originalText = button.textContent;
            button.textContent = '⏳ Generating JPG...';
            button.disabled = true;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const link = document.createElement('a');
            link.download = `${document.getElementById('invoiceNumber').value || 'invoice'}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();

            // Reset button
            button.textContent = originalText;
            button.disabled = false;
        } catch (error) {
            console.error('Error generating JPG:', error);
            alert('Error generating JPG. Please try again.');
            
            // Reset button
            const button = document.getElementById('downloadJPG');
            button.textContent = '🖼️ Download JPG';
            button.disabled = false;
        }
    }

    printInvoice() {
        // Smooth scroll to preview
        document.getElementById('invoicePreview').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
        setTimeout(() => {
            window.print();
        }, 500);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update toggle button
        const toggleButton = document.getElementById('themeToggle');
        toggleButton.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const toggleButton = document.getElementById('themeToggle');
        toggleButton.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuickBill();
});

// Add some smooth animations
document.addEventListener('DOMContentLoaded', () => {
    // Fade in animation for main content
    const mainContent = document.querySelector('.main-content');
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        mainContent.style.transition = 'all 0.6s ease';
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'translateY(0)';
    }, 100);

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + P for print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        document.getElementById('printInvoice').click();
    }
    
    // Ctrl/Cmd + S for PDF download
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('downloadPDF').click();
    }
    
    // Ctrl/Cmd + D for theme toggle
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.getElementById('themeToggle').click();
    }
});