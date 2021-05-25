import React, { useEffect, useMemo, useState } from 'react'
import st from 'styles/components/layout/Documents.module.sass'
import moment from 'moment'
import dict from 'dictionary.json'
import { documentsActions, getDocuments } from 'store/documents'
import { getUsers } from 'store/users'
import { Table, TableFilter, TableSearch } from 'components/Table'
import { useDispatchTyped } from 'hooks/dispatchTyped.hook'
import { useRequest } from 'hooks/request.hook'
import { requestsStatus } from 'utils/requestsStatus'
import { Loading } from 'components/Loading'
import { Error } from 'components/Error'
import { useHistory } from 'react-router'

interface DocumentsProps {
  id: string
  label?: string
  path: string
  head: { [key: string]: string }
  statusFilter?: boolean
}
export const Documents: React.FC<DocumentsProps> = ({ id, label, path, head, statusFilter: statusFilterEnabled }) => {
  const history = useHistory()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<{ [el: string]: boolean }>({})
  const dispatch = useDispatchTyped()
  const request = () => getDocuments({ path, search: search.toLowerCase() })
  const [documents, documentsStatus, documentsError] = useRequest(s => s.documents, request)
  const [users, usersStatus, usersError] = useRequest(
    s => s.users,
    () => getUsers()
  )
  const els = useMemo(
    () =>
      documents.list.map(d => ({
        _id: d._id,
        id: d._id.slice(-8),
        author: users.find(u => u.userId === d.userId)?.username || d.userId,
        title: d.title,
        status: dict.documentStatus[d.status],
        creationDate: moment(d.createdAt).format(`DD.MM.YYYY`),
        updateDate: d.updatedAt ? moment(d.updatedAt).format(`DD.MM.YYYY`) : '-----',
      })),
    [documents, users]
  )
  const status = requestsStatus(documentsStatus, usersStatus)
  useEffect(
    () => () => {
      dispatch(documentsActions.reset())
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const load = () => dispatch(request())
  return (
    <div className={st.table}>
      {status === 'done' && (
        <Table
          {...{ id, label, head, els, load }}
          menu={
            <>
              {statusFilterEnabled && (
                <TableFilter label="Статус" column="status" els={els} filter={statusFilter} set={setStatusFilter} />
              )}
              <TableSearch value={search} set={setSearch} />
            </>
          }
          link={el => history.push(`/documents/${el._id}`)}
        />
      )}
      {status === 'loading' && <Loading />}
      {status === 'error' && <Error msg={[documentsError, usersError]} />}
    </div>
  )
}
