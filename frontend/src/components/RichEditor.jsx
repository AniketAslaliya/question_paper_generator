import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichEditor = ({ value, onChange }) => {
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
