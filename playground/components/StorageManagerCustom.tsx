import React from 'react';
import { StorageManager } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';


const StorageManagerCustom = () => {
    return (
        <div>
            <StorageManager
                acceptedFileTypes={[
                    'application/pdf'  // Asegúrate de incluir 'application/pdf' si solo trabajas con PDFs
                ]}
                path={({ identityId }) => `private/${identityId}/`}
                maxFileCount={1}
                showThumbnails={true}
                displayText={{
                    dropFilesText: 'Arrastrar y soltar archivos aquí para subir',
                    browseFilesText: 'Escoger archivo',
                }}
            />
        </div>
    );
};

export default StorageManagerCustom