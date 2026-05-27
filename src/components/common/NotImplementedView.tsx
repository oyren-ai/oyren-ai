interface NotImplementedViewProps {
    view: string;
}
const NotImplementedView: React.FC<NotImplementedViewProps> = ({view}) => {
    return (
        <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">View not implemented: {view}</p>
        </div>
    </div>
    );
};

export default NotImplementedView;