import { IconUpload } from "../LandingPageIcon";

function SubUserChangeImage() {
    return (
        <div className="w-full border-3 border-dashed border-dark-grey shadow-md rounded-xl mx-3 px-7 py-20 flex items-center justify-center hover:bg-very-light-grey hover:cursor-pointer">
            <div className="flex justify-center flex-col items-center">
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
