// Keep the earlier template experiment separate from the recognition-first homepage.
if(new URLSearchParams(location.search).get('view')==='templates'){
  void import('./main');
}else{
  void import('./home-screen');
}
export {};
