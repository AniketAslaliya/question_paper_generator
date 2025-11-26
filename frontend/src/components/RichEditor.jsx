import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save } from 'lucide-react';

const RichEditor = ({ value, onChange, onSave }) => {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {onSave && (
                <div className="p-4 border-b border-slate-200 flex justify-end">
                    <button
                        onClick={() => onSave(value)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            )}
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                className="h-[600px] mb-12"
            />
        </div>
    );
};

export default RichEditor;
