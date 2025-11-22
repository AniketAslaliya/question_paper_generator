const StepIndicator = ({ currentStep }) => {
    const steps = [
        { number: 1, title: 'Upload' },
        { number: 2, title: 'Template' },
        { number: 3, title: 'Configure' },
        { number: 4, title: 'Generate' }
    ];

    return (
        <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={`
                                w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all
                                ${currentStep === step.number
                                    ? 'bg-black text-white ring-4 ring-black/20 scale-110'
                                    : currentStep > step.number
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                }
                            `}
                        >
                            {currentStep > step.number ? '✓' : step.number}
                        </div>
                        <span className={`mt-2 text-sm font-semibold ${currentStep >= step.number ? 'text-black' : 'text-gray-500'}`}>
                            {step.title}
                        </span>
                    </div>

                    {index < steps.length - 1 && (
                        <div className="w-20 h-1 mx-4 rounded-full"
                            style={{
                                background: currentStep > step.number ? '#22c55e' : '#e5e7eb'
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default StepIndicator;
