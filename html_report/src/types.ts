export interface ImageInfo {
  name: string;
  tag: string | null;
  architecture: string | null;
  total_size: number;
  layers: LayerInfo[];
}

export interface LayerInfo {
  digest: string;
  created_by: string | null;
  size: number;
  files: FileEntry[];
}

export interface FileEntry {
  path: string;
  size: number;
  is_whiteout: boolean;
}

export interface TreeNode {
  name: string;
  size: number;
  is_whiteout: boolean;
  children: Map<string, TreeNode>;
  isFile: boolean;
}
