import React from 'react';
import { StorageManager } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';


const CustomStorageManager = () => {
    const processFile = async ({ file }) => {
        const fileExtension = file.name.split('.').pop();

        return file
            .arrayBuffer()
            .then((filebuffer) => window.crypto.subtle.digest('SHA-1', filebuffer))
            .then((hashBuffer) => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray
                    .map((a) => a.toString(16).padStart(2, '0'))
                    .join('');
                return { file, key: `${hashHex}.${fileExtension}` };
            });
    };
    return (
        <div>
            <StorageManager
                acceptedFileTypes={[
                    'application/pdf' 
                ]}
                path={({ identityId }) => `private/${identityId}/`}
                maxFileCount={1}
                showThumbnails={true}
                processFile={processFile}
                displayText={{
                    dropFilesText: 'Arrastrar y soltar archivos aquí para subir',
                    browseFilesText: 'Escoger archivo',
                }}
            />
        </div>
    );
};

export default CustomStorageManager