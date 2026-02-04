// Media upload handler
let uploadedMediaData = null;

window.handleMediaUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedMediaData = e.target.result;
        const preview = document.getElementById('media-preview');

        if (file.type.startsWith('video/')) {
            preview.innerHTML = `<video src="${e.target.result}" class="w-full h-full object-cover" controls></video>`;
        } else {
            preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" alt="Project media">`;
        }

        // Add remove button
        const container = preview.parentElement;
        if (!container.querySelector('.remove-media-btn')) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-media-btn absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeMedia();
            };
            removeBtn.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
            container.appendChild(removeBtn);
            lucide.createIcons();
        }

        lucide.createIcons();
    };
    reader.readAsDataURL(file);
};

window.removeMedia = () => {
    uploadedMediaData = null;
    const preview = document.getElementById('media-preview');
    preview.innerHTML = `
        <span class="text-gray-400 flex flex-col items-center pointer-events-none">
            <i data-lucide="upload" class="w-12 h-12 mb-2 opacity-50"></i>
            <span class="text-sm font-medium">Click to upload image or video</span>
        </span>
    `;
    document.getElementById('media-upload').value = '';
    const removeBtn = preview.parentElement.querySelector('.remove-media-btn');
    if (removeBtn) removeBtn.remove();
    lucide.createIcons();
};
