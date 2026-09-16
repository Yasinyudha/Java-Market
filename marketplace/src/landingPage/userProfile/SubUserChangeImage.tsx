import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { IconUpload } from "../LandingPageIcon";
import { useSignup } from "../../signupPage/SignupStore";

function SubUserChangeImage() {
    const [userAuth, setUserAuth] = useSignup("userAuth");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State untuk menyimpan log dan progress
    const [progress, setProgress] = useState<number>(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [fileSize, setFileSize] = useState<number>(0);

    // Helper untuk menambah baris log
    const addLog = (message: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, `[${time}] ${message}`]);
    };

    // Trigger click pada saat input file tersembunyi
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const uploadFile = async (file: File) => {
        // Reset state
        setLogs([]);
        setProgress(0);
        setIsUploading(true);
        setFileSize(0);

        addLog(`Memulai validasi file: ${file.name}`);
        if (file.size > 1024 * 1024 * 5) {
            addLog("Error: ukuran file melebihi limit 5MB");
            setIsUploading(false);
            return;
        }
        setFileSize(file.size);

        addLog(`Ukuran file valid: ${(file.size / 1024).toFixed(1)} KB`);
        addLog("Menyiapkan FormData...");

        const formData = new FormData();
        formData.append("image", file);

        // Gunakan XMLHttpRequest untuk memantau progress upload
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        // Progress event
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round(
                    (event.loaded / event.total) * 100,
                );
                setProgress(percentComplete);
                addLog(`Progress upload: ${percentComplete}%`);
            }
        };

        // Load event
        xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    setUserAuth({
                        ...userAuth,
                        avatar_path: data.filepath,
                    });

                    window.location.reload();
                } catch (error) {
                    addLog(
                        `Gagal membaca respon server JSON dengan error ${error}`,
                    );
                }
            } else {
                try {
                    const data = JSON.parse(xhr.responseText);
                    addLog(`Upload gagal (${xhr.status}): ${data.filepath}`);
                } catch (error) {
                    addLog(
                        `Server merespon dengan status: ${xhr.status} dan error : ${error}`,
                    );
                }
            }

            xhr.onerror = () => {
                setIsUploading(false);
                addLog("Error: Gagal terhubung ke backend server");
            };
        };

        xhr.open("POST", "http://localhost:8080/upload");
        addLog("Mengirim request upload");
        xhr.send(formData);
    };

    // Handle via file picker
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    };

    // Handle via drag and drop
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div>
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDrag={handleDragOver}
                className="w-full border-3 border-dashed border-dark-grey shadow-md rounded-xl mx-3 px-7 py-20 flex items-center justify-center hover:bg-very-light-grey hover:cursor-pointer"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="flex justify-center flex-col items-center pointer-events-none">
                    <div className="flex items-center justify-center opacity-10">
                        <IconUpload />
                    </div>
                    <span className="font-jakarta-medium text-lg">
                        Drag and drop your image here
                    </span>
                </div>
            </div>
            {isUploading && (
                <div className="mx-3 w-full px-7 py-2 mt-5 flex flex-col gap-1">
                    <span className="font-jakarta-bold text-base">
                        Tasya Profile.png
                    </span>
                    <div className="flex items-center font-jakarta-regular text-sm gap-3">
                        <span>{(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>|</span>
                        <span>{progress}% upload completed</span>
                    </div>
                    <div
                        className="rounded-full w-full h-3 border border-dark-grey"
                        style={{
                            background: `linear-gradient(to right, #6c757d ${progress}%, transparent ${progress}%)`,
                        }}
                    ></div>
                </div>
            )}
            <div
                className={`border border-dark-grey rounded-sm mx-3 w-full px-7 py-2 mt-5 ${logs.length === 0 && "hidden"}`}
            >
                {logs.map((log, index) => (
                    <p key={index}>{log}</p>
                ))}
            </div>
        </div>
    );
}

export default SubUserChangeImage;
