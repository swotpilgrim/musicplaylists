class ContentBrowser {
    constructor() {
        this.collections = {};
        this.selectedCollection = null;
        this.selectedCategory = null;
        this.selectedItem = null;
        // Base collections - these will be extended by any matching files
        this.baseFiles = ['collection_1.json', 'collection_2.json', 'collection_3.json', 'collection_4.json'];
    }

    async init() {
        await this.loadCollections();
        this.showCollections();
    }

    async discoverExtensionFiles() {
        const extensionFiles = [];
        
        // Try numbered extension patterns for each base file
        for (const baseFile of this.baseFiles) {
            const baseName = baseFile.replace('.json', '');
            let consecutiveMisses = 0;
            const maxConsecutiveMisses = 3;
            
            // Try numbers starting from 001
            for (let i = 1; i <= 50; i++) {
                const paddedNumber = i.toString().padStart(3, '0');
                const extensionFile = `${baseName}_${paddedNumber}.json`;
                
                try {
                    const response = await fetch(extensionFile);
                    if (response.ok) {
                        extensionFiles.push(extensionFile);
                        console.log(`Found extension file: ${extensionFile}`);
                        consecutiveMisses = 0;
                    } else {
                        consecutiveMisses++;
                        if (consecutiveMisses >= maxConsecutiveMisses) {
                            break;
                        }
                    }
                } catch (e) {
                    consecutiveMisses++;
                    if (consecutiveMisses >= maxConsecutiveMisses) {
                        break;
                    }
                }
            }
        }
        
        return extensionFiles;
    }

    async loadCollections() {
        // First load base files
        for (const file of this.baseFiles) {
            try {
                const data = await fetch(file).then(r => r.json());
                this.collections[data.id] = data;
                console.log(`✅ Loaded BASE: ${file} → ${data.title}`);
            } catch (e) {
                console.error(`❌ Error loading base file ${file}:`, e);
            }
        }

        // Then discover and load extension files
        const extensionFiles = await this.discoverExtensionFiles();
        
        for (const file of extensionFiles) {
            try {
                const data = await fetch(file).then(r => r.json());
                await this.mergeCollectionData(data, file);
                console.log(`🔗 Merged EXTENSION: ${file} → ${data.target_collection_id}`);
            } catch (e) {
                console.error(`❌ Error loading extension file ${file}:`, e);
            }
        }
    }

    async mergeCollectionData(extensionData, fileName) {
        const targetCollectionId = extensionData.target_collection_id || extensionData.id;
        
        if (!this.collections[targetCollectionId]) {
            console.warn(`❌ Target collection ${targetCollectionId} not found for ${fileName}`);
            return;
        }

        const targetCollection = this.collections[targetCollectionId];

        // Merge categories
        if (extensionData.categories) {
            Object.entries(extensionData.categories).forEach(([catId, categoryData]) => {
                if (targetCollection.categories[catId]) {
                    // Category exists, merge items
                    if (categoryData.items) {
                        Object.assign(targetCollection.categories[catId].items, categoryData.items);
                        console.log(`  📁 Added items to existing category: ${catId}`);
                    }
                } else {
                    // New category, add it
                    targetCollection.categories[catId] = categoryData;
                    console.log(`  📁 Created new category: ${catId}`);
                }
            });
        }
    }

    showCollections() {
        this.selectedCollection = null;
        this.selectedCategory = null;
        this.selectedItem = null;
        
        const container = document.getElementById('column1');
        container.innerHTML = '<div class="column-title">COLLECTIONS</div>';
        
        Object.values(this.collections).forEach(collection => {
            const element = document.createElement('div');
            element.className = 'item';
            element.textContent = collection.title;
            element.onclick = () => this.showCategories(collection.id);
            container.appendChild(element);
        });

        document.getElementById('column2').innerHTML = '<div class="column-title">CATEGORIES</div>';
        document.getElementById('column3').innerHTML = '<div class="column-title">ITEMS</div>';
        document.getElementById('column4').innerHTML = '<div class="column-title">CONTENT</div>';
    }

    showCategories(collectionId) {
        this.selectedCollection = collectionId;
        this.selectedCategory = null;
        this.selectedItem = null;
        
        document.querySelectorAll('#column1 .item').forEach(el => {
            el.classList.remove('selected');
            if (el.textContent === this.collections[collectionId].title) {
                el.classList.add('selected');
            }
        });

        const container = document.getElementById('column2');
        container.innerHTML = '<div class="column-title">CATEGORIES</div>';
        
        const collection = this.collections[collectionId];
        Object.entries(collection.categories).forEach(([catId, category]) => {
            const element = document.createElement('div');
            element.className = 'item';
            element.textContent = category.title;
            element.onclick = () => this.showItems(collectionId, catId);
            container.appendChild(element);
        });

        document.getElementById('column3').innerHTML = '<div class="column-title">ITEMS</div>';
        document.getElementById('column4').innerHTML = '<div class="column-title">CONTENT</div>';
    }

    showItems(collectionId, categoryId) {
        this.selectedCategory = categoryId;
        this.selectedItem = null;
        
        document.querySelectorAll('#column2 .item').forEach(el => {
            el.classList.remove('selected');
            if (el.textContent === this.collections[collectionId].categories[categoryId].title) {
                el.classList.add('selected');
            }
        });

        const container = document.getElementById('column3');
        container.innerHTML = '<div class="column-title">ITEMS</div>';
        
        const category = this.collections[collectionId].categories[categoryId];
        Object.entries(category.items).forEach(([itemId, item]) => {
            const element = document.createElement('div');
            element.className = 'item';
            element.textContent = item.title;
            element.onclick = () => this.showContent(collectionId, categoryId, itemId);
            container.appendChild(element);
        });

        document.getElementById('column4').innerHTML = '<div class="column-title">CONTENT</div>';
    }

    showContent(collectionId, categoryId, itemId) {
        this.selectedItem = itemId;
        
        document.querySelectorAll('#column3 .item').forEach(el => {
            el.classList.remove('selected');
            if (el.textContent === this.collections[collectionId].categories[categoryId].items[itemId].title) {
                el.classList.add('selected');
            }
        });

        const container = document.getElementById('column4');
        const item = this.collections[collectionId].categories[categoryId].items[itemId];
        
        // Add image support like your other app
        let imageHTML = '';
        if (item.image) {
            imageHTML = `<img src="${item.image}" alt="${item.title}" style="display:block;margin:0 auto 10px;width:220px;max-width:100%;">`;
        }
        
        container.innerHTML = `
            <div class="column-title">CONTENT</div>
            <div class="content-card">
                <div class="content-title">${item.title}</div>
                <div class="content-description">${item.description}</div>
                ${item.metadata ? `<div class="content-metadata"><h4>Additional Info:</h4><em>${item.metadata}</em></div>` : ''}
                ${imageHTML}
                <div class="content-text">${item.content || 'No detailed content available.'}</div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const app = new ContentBrowser();
    app.init();
});