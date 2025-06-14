<script lang="ts">
    import { BBSUtils } from '$lib/cryptography/BBS';

    export let showForm = false;
    export let availableRecords: any[] = [];
    export let userRole: string = '';

    let selectedRecordId = '';
    let shouldEncrypt = false;
    let generatedRC4Key = '';
    let mode = 'download'; // 'download' or 'decrypt'

    // Decrypt mode variables
    let uploadedFile: File | null = null;
    let decryptKey = '';
    let uploadError = '';

    // Loading states
    let isGenerating = false;
    let isDecrypting = false;

    // Generate RC4 key when encryption is enabled
    $: if (shouldEncrypt && !generatedRC4Key) {
        generatedRC4Key = BBSUtils.generateSecureHex(32); // Generate 32-byte hex key
    }

    function closeForm() {
        showForm = false;
        resetForm();
    }

    function resetForm() {
        selectedRecordId = '';
        shouldEncrypt = false;
        generatedRC4Key = '';
        uploadedFile = null;
        decryptKey = '';
        uploadError = '';
        isGenerating = false;
        isDecrypting = false;
    }

    function setMode(newMode: string) {
        resetForm();
        mode = newMode;
    }

    function handleFileUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        uploadError = '';
        
        if (!file) {
            uploadedFile = null;
            return;
        }
        
        if (file.type !== 'application/pdf') {
            uploadError = 'Please select a PDF file';
            uploadedFile = null;
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            uploadError = 'File too large (max 50MB)';
            uploadedFile = null;
            return;
        }
        
        uploadedFile = file;
    }

    async function handlePDFGeneration() {
        if (!selectedRecordId) {
            alert('Please select a record');
            return;
        }

        isGenerating = true;

        try {
            const formData = new FormData();
            formData.append('recordId', selectedRecordId);
            formData.append('encrypt', shouldEncrypt.toString());
            if (shouldEncrypt && generatedRC4Key) {
                formData.append('rc4Key', generatedRC4Key);
            }

            console.log('Sending PDF generation request:', {
                recordId: selectedRecordId,
                encrypt: shouldEncrypt,
                hasKey: !!generatedRC4Key
            });

            const response = await fetch('/api/pdf/generate', {
                method: 'POST',
                body: formData,
                // Add proper headers and credentials
                credentials: 'same-origin',
                headers: {
                    // Don't set Content-Type for FormData - browser will set it with boundary
                }
            });

            console.log('PDF generation response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Failed to generate PDF';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    // If JSON parsing fails, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Check if response is actually a PDF
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('Server did not return a PDF file');
            }

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Get filename from response headers
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition 
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                : `transcript_${selectedRecordId}_${Date.now()}.pdf`;
            
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the blob URL
            window.URL.revokeObjectURL(url);

            console.log('PDF download triggered successfully');

            // Close form after successful download
            closeForm();
            
        } catch (error) {
            console.error('PDF generation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error generating PDF: ${errorMessage}`);
        } finally {
            isGenerating = false;
        }
    }

    async function handlePDFDecryption() {
        if (!uploadedFile || !decryptKey.trim()) {
            alert('Please select a file and enter the decryption key');
            return;
        }

        isDecrypting = true;

        try {
            const formData = new FormData();
            formData.append('encryptedPdf', uploadedFile);
            formData.append('rc4Key', decryptKey.trim());

            const response = await fetch('/api/pdf/decrypt', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || 'Failed to decrypt PDF');
            }

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Get filename from response headers
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition 
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                : `decrypted_${uploadedFile.name}`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Close form after successful download
            closeForm();
            
        } catch (error) {
            console.error('PDF decryption error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error: ${errorMessage}`);
        } finally {
            isDecrypting = false;
        }
    }
</script>

{#if showForm}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-center justify-center p-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" on:click={closeForm}></div>
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
                
                <!-- Tab Navigation -->
                <div class="border-b border-gray-200">
                    <nav class="flex">
                        <button
                            type="button"
                            class="flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors"
                            class:border-indigo-500={mode === 'download'}
                            class:text-indigo-600={mode === 'download'}
                            class:border-transparent={mode !== 'download'}
                            class:text-gray-500={mode !== 'download'}
                            on:click={() => setMode('download')}
                        >
                            Download PDF
                        </button>
                        <button
                            type="button"
                            class="flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors"
                            class:border-indigo-500={mode === 'decrypt'}
                            class:text-indigo-600={mode === 'decrypt'}
                            class:border-transparent={mode !== 'decrypt'}
                            class:text-gray-500={mode !== 'decrypt'}
                            on:click={() => setMode('decrypt')}
                        >
                            Decrypt PDF
                        </button>
                    </nav>
                </div>

                {#if mode === 'download'}
                    <!-- Download PDF Tab -->
                    <form on:submit|preventDefault={handlePDFGeneration}>
                        <!-- Modal Header -->
                        <div class="bg-white px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xl font-semibold text-gray-900">Download PDF Transkrip</h3>
                                <button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeForm}>
                                    <span class="text-2xl">&times;</span>
                                </button>
                            </div>
                        </div>

                        <!-- Modal Content -->
                        <div class="p-6 space-y-6">
                            <!-- Record Selection -->
                            <div>
                                <label for="recordId" class="block text-sm font-medium text-gray-700">
                                    Pilih Transkrip
                                </label>
                                <select 
                                    id="recordId" 
                                    bind:value={selectedRecordId}
                                    required 
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option disabled value="">-- Pilih transkrip untuk diunduh --</option>
                                    {#each availableRecords as record}
                                        <option value={record.id}>
                                            {#if userRole === 'Mahasiswa'}
                                                Transkrip Anda
                                            {:else}
                                                {record.student.nim} - {record.student.fullName}
                                            {/if}
                                        </option>
                                    {/each}
                                </select>
                            </div>

                            <!-- Encryption Option -->
                            <div class="space-y-4">
                                <div class="flex items-center">
                                    <input 
                                        id="encrypt" 
                                        type="checkbox" 
                                        bind:checked={shouldEncrypt}
                                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label for="encrypt" class="ml-2 block text-sm text-gray-900">
                                        Enkripsi PDF dengan RC4
                                    </label>
                                </div>

                                <!-- Show generated key when encryption is enabled -->
                                {#if shouldEncrypt && generatedRC4Key}
                                    <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                        <label class="block text-sm font-medium text-yellow-800 mb-2">
                                            Kunci RC4 yang Dibuat Otomatis:
                                        </label>
                                        <div class="flex items-center space-x-2">
                                            <input 
                                                type="text" 
                                                value={generatedRC4Key}
                                                readonly
                                                class="flex-1 rounded-md border-gray-300 bg-gray-50 text-sm font-mono"
                                            />
                                            <button 
                                                type="button"
                                                on:click={() => navigator.clipboard.writeText(generatedRC4Key)}
                                                class="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p class="mt-2 text-xs text-yellow-700">
                                            <strong>PENTING:</strong> Simpan kunci ini dengan aman! Anda membutuhkannya untuk membuka PDF terenkripsi nanti.
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <!-- Info Box -->
                            <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div class="flex">
                                    <svg class="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                    </svg>
                                    <div class="text-sm text-blue-800">
                                        <p class="font-medium">Informasi PDF:</p>
                                        <ul class="mt-1 list-disc list-inside space-y-1">
                                            <li>PDF berisi data transkrip lengkap dengan tanda tangan digital Kaprodi</li>
                                            <li>Enkripsi RC4 bersifat opsional untuk keamanan tambahan</li>
                                            <li>File PDF akan otomatis terunduh ke komputer Anda</li>
                                            <li>PDF terenkripsi dapat dibuka menggunakan tab "Decrypt PDF"</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Modal Footer -->
                        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
                            <div class="flex gap-4">
                                <button 
                                    type="submit" 
                                    disabled={!selectedRecordId || isGenerating}
                                    class="flex-1 justify-center rounded-md bg-green-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {#if isGenerating}
                                        <span class="flex items-center justify-center">
                                            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </span>
                                    {:else}
                                        {shouldEncrypt ? 'Download PDF Terenkripsi' : 'Download PDF'}
                                    {/if}
                                </button>
                                <button 
                                    type="button" 
                                    on:click={resetForm}
                                    disabled={isGenerating}
                                    class="justify-center rounded-md bg-gray-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:bg-gray-400"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>

                {:else}
                    <!-- Decrypt PDF Tab -->
                    <form on:submit|preventDefault={handlePDFDecryption}>
                        <!-- Modal Header -->
                        <div class="bg-white px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xl font-semibold text-gray-900">Decrypt PDF Terenkripsi</h3>
                                <button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeForm}>
                                    <span class="text-2xl">&times;</span>
                                </button>
                            </div>
                        </div>

                        <!-- Modal Content -->
                        <div class="p-6 space-y-6">
                            <!-- File Upload -->
                            <div>
                                <label for="pdfFile" class="block text-sm font-medium text-gray-700">
                                    Pilih PDF Terenkripsi <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    id="pdfFile" 
                                    type="file" 
                                    accept=".pdf"
                                    required
                                    on:change={handleFileUpload}
                                    class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {#if uploadError}
                                    <p class="mt-1 text-xs text-red-500">{uploadError}</p>
                                {/if}
                                {#if uploadedFile}
                                    <p class="mt-1 text-xs text-gray-500">
                                        File dipilih: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                {/if}
                            </div>

                            <!-- RC4 Decryption Key Input -->
                            <div>
                                <label for="decryptKey" class="block text-sm font-medium text-gray-700">
                                    Kunci RC4 untuk Dekripsi <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    id="decryptKey" 
                                    type="text" 
                                    bind:value={decryptKey}
                                    required
                                    placeholder="Masukkan kunci RC4 yang digunakan saat enkripsi"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                                />
                                <p class="mt-1 text-xs text-gray-500">
                                    Gunakan kunci yang sama dengan yang ditampilkan saat download PDF terenkripsi
                                </p>
                            </div>

                            <!-- Info Box -->
                            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <div class="flex">
                                    <svg class="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                    <div class="text-sm text-yellow-800">
                                        <p class="font-medium">Catatan Penting:</p>
                                        <ul class="mt-1 list-disc list-inside space-y-1">
                                            <li>Pastikan file yang dipilih adalah PDF yang terenkripsi dengan RC4</li>
                                            <li>Kunci dekripsi harus sama persis dengan kunci yang ditampilkan saat download</li>
                                            <li>Jika kunci salah, proses dekripsi akan gagal</li>
                                            <li>PDF yang berhasil didekripsi akan otomatis diunduh</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Modal Footer -->
                        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
                            <div class="flex gap-4">
                                <button 
                                    type="submit" 
                                    disabled={!uploadedFile || !decryptKey.trim() || isDecrypting}
                                    class="flex-1 justify-center rounded-md bg-red-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {#if isDecrypting}
                                        <span class="flex items-center justify-center">
                                            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Decrypting...
                                        </span>
                                    {:else}
                                        Dekripsi & Download PDF
                                    {/if}
                                </button>
                                <button 
                                    type="button" 
                                    on:click={resetForm}
                                    disabled={isDecrypting}
                                    class="justify-center rounded-md bg-gray-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:bg-gray-400"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>
                {/if}
            </div>
        </div>
    </div>
{/if}