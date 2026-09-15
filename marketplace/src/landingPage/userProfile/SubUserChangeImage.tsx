import { ChangeEvent, DragEvent, useRef } from "react";
import { IconUpload } from "../LandingPageIcon";

function SubUserChangeImage() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Trigger click pada saat input file tersembunyi
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("http://localhost:8080/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                alert("Upload berhasil: " + data.filepath);
            } else {
                alert("Upload gagal: " + data.message);
            }
        } catch (error) {
            console.error("Error uploading file: ", error);
        }
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
    );
}

export default SubUserChangeImage;
