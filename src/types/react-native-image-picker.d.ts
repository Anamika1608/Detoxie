declare module 'react-native-image-picker' {
  export type MediaType = 'photo' | 'video' | 'mixed';

  export interface Asset {
    base64?: string;
    uri?: string;
    fileName?: string;
    type?: string;
    width?: number;
    height?: number;
  }

  export interface ImageLibraryOptions {
    mediaType?: MediaType;
    includeBase64?: boolean;
    selectionLimit?: number;
    quality?: number;
  }

  export interface ImagePickerResponse {
    assets?: Asset[];
    didCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
  }

  export function launchImageLibrary(
    options?: ImageLibraryOptions
  ): Promise<ImagePickerResponse>;
}



