// Media upload handler with server upload
let uploadedMediaUrl = null;

window.handleMediaUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading state
    const preview = document.getElementById('media-preview');
    preview.innerHTML = '<div class="text-gray-500">Uploading...</div>';

    try {
        // Create FormData and upload to server
        const formData = new FormData();
        formData.append('media', file);

        const response = await fetch(window.API.upload, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        uploadedMediaUrl = data.url; // Store the server URL

        // Show preview
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
            preview.innerHTML = `
                <video src="${uploadedMediaUrl}" class="w-full h-full object-cover rounded-xl" controls></video>
                <button onclick="removeMedia()" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            `;
        } else {
            preview.innerHTML = `
                <img src="${uploadedMediaUrl}" class="w-full h-full object-cover rounded-xl" alt="Preview">
                <button onclick="removeMedia()" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            `;
        }

        lucide.createIcons();
    } catch (error) {
        console.error('Upload error:', error);
        preview.innerHTML = '<div class="text-red-500">Upload failed. Please try again.</div>';
        uploadedMediaUrl = null;
    }
};

window.removeMedia = async () => {
    if (uploadedMediaUrl) {
        try {
            // Extract filename from URL
            const filename = uploadedMediaUrl.split('/').pop();

            // Delete from server
            // Handle both Node.js (REST path) and PHP (query param or separate logic)
            // For PHP simple implementation, we might send a DELETE request to the same endpoint with filename

            let deleteUrl;
            if (window.API.upload.endsWith('.php')) {
                // PHP style: api/upload.php?filename=xyz
                deleteUrl = `${window.API.upload}?filename=${filename}`;
            } else {
                // Node style: api/upload/xyz
                deleteUrl = `${window.API.upload}/${filename}`;
            }

            await fetch(deleteUrl, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Delete error:', error);
        }
    }

    uploadedMediaUrl = null;
    const preview = document.getElementById('media-preview');
    preview.innerHTML = `
        <div class="text-gray-400 flex flex-col items-center">
            <i data-lucide="image" class="w-12 h-12 mb-2 opacity-50"></i>
            <span class="text-sm font-medium">Upload Image/Video</span>
        </div>
    `;
    lucide.createIcons();
};

// Export for use in app.js
window.getUploadedMediaUrl = () => uploadedMediaUrl;
